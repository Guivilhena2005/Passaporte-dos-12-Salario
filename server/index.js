import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Defina SESSION_SECRET com pelo menos 32 caracteres no .env');
}
const PgStore = connectPgSimple(session);
const store = new PgStore({ pool, tableName: 'session', createTableIfMissing: false });
const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(session({
  name: 'passaporte.sid', secret: process.env.SESSION_SECRET,
  resave: false, saveUninitialized: false, store,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 }
}));
const limit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos.' } });
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const logged = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: 'Faça login para continuar.' });
const validEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const publicUser = u => ({ id: String(u.id), name: u.nome, email: u.email });
const establishSession = (req, res, user, status = 200) => {
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Falha ao criar sessão.' });
    req.session.userId = String(user.id);
    req.session.save(error => error
      ? res.status(500).json({ error: 'Falha ao salvar sessão.' })
      : res.status(status).json({ user: publicUser(user) }));
  });
};

app.post('/api/auth/register', limit, wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80 ||
      !validEmail(email) || typeof password !== 'string' || password.length < 10 ||
      Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: 'Informe nome, e-mail válido e senha de 10 a 72 bytes.' });
  }
  const normalized = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      'INSERT INTO usuarios(nome,email,senha_hash) VALUES ($1,$2,$3) RETURNING id,nome,email',
      [name.trim(), normalized, hash]
    );
    establishSession(req, res, rows[0], 201);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    throw e;
  }
}));

app.post('/api/auth/login', limit, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!validEmail(email) || typeof password !== 'string') return res.status(400).json({ error: 'Credenciais inválidas.' });
  const { rows } = await pool.query('SELECT id,nome,email,senha_hash FROM usuarios WHERE email=$1 LIMIT 1', [email.trim().toLowerCase()]);
  const ok = rows.length > 0 && await bcrypt.compare(password, rows[0].senha_hash);
  if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  establishSession(req, res, rows[0]);
}));

app.get('/api/auth/me', wrap(async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  const { rows } = await pool.query('SELECT id,nome,email FROM usuarios WHERE id=$1', [req.session.userId]);
  if (!rows.length) return res.status(401).json({ error: 'Não autenticado.' });
  res.json({ user: publicUser(rows[0]) });
}));
app.post('/api/auth/logout', (req, res) => req.session.destroy(err => {
  if (err) return res.status(500).json({ error: 'Não foi possível sair.' });
  res.clearCookie('passaporte.sid', { path: '/' });
  res.json({ ok: true });
}));
app.get('/api/data/:type', logged, wrap(async (req, res) => {
  if (!['planning', 'goals'].includes(req.params.type)) return res.sendStatus(404);
  const { rows } = await pool.query('SELECT conteudo FROM dados_usuario WHERE usuario_id=$1 AND tipo=$2', [req.session.userId, req.params.type]);
  res.json({ data: rows.length ? rows[0].conteudo : null });
}));
app.put('/api/data/:type', logged, wrap(async (req, res) => {
  if (!['planning', 'goals'].includes(req.params.type)) return res.sendStatus(404);
  const value = req.body?.data;
  if (value === undefined || value === null || typeof value !== 'object' || JSON.stringify(value).length > 50000)
    return res.status(400).json({ error: 'Dados inválidos ou muito grandes.' });
  if (req.params.type === 'planning' && (!Number.isSafeInteger(value.salaryCents) || value.salaryCents < 0 ||
      !Array.isArray(value.percents) || value.percents.length !== 5 ||
      value.percents.some(n => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 100) ||
      Math.abs(value.percents.reduce((a, b) => a + b, 0) - 100) > 0.0001))
    return res.status(400).json({ error: 'Planejamento inválido.' });
  if (req.params.type === 'goals' && (!Array.isArray(value) || value.length > 200 ||
      value.some(g => !g || typeof g.name !== 'string' || g.name.length > 150 ||
      !Number.isFinite(g.target) || g.target <= 0 || !Number.isFinite(g.saved) || g.saved < 0)))
    return res.status(400).json({ error: 'Metas inválidas.' });
  await pool.query(`INSERT INTO dados_usuario(usuario_id,tipo,conteudo) VALUES ($1,$2,$3::jsonb)
    ON CONFLICT (usuario_id,tipo) DO UPDATE SET conteudo=EXCLUDED.conteudo, atualizado_em=NOW()`,
    [req.session.userId, req.params.type, JSON.stringify(value)]);
  res.json({ ok: true });
}));
app.get('/api/status-banco', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT current_database() AS banco');
  res.json({ conectado: true, banco: rows[0].banco });
}));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(express.static(root, { extensions: ['html'] }));
app.use((err, _req, res, _next) => {
  console.error('Erro de API:', err);
  res.status(500).json({ error: 'Erro interno. Tente novamente.' });
});
const port = Number(process.env.PORT || 3000);
pool.query('SELECT 1').then(() => {
  app.listen(port, () => console.log(`Passaporte: http://localhost:${port}`));
}).catch(error => {
  console.error('Não foi possível conectar ao PostgreSQL:', error.message);
  process.exitCode = 1;
  pool.end();
});
