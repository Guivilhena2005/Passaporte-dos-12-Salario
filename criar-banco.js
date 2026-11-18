
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id BIGSERIAL PRIMARY KEY,
      nome VARCHAR(80) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      criado_em TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS dados_usuario (
      usuario_id BIGINT NOT NULL REFERENCES usuarios(id)
        ON DELETE CASCADE,
      tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('planning', 'goals')),
      conteudo JSONB NOT NULL,
      atualizado_em TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (usuario_id, tipo)
    );

    CREATE TABLE IF NOT EXISTS "session" (
      "sid" VARCHAR NOT NULL PRIMARY KEY,
      "sess" JSON NOT NULL,
      "expire" TIMESTAMP(6) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "IDX_session_expire"
      ON "session" ("expire");
  `);

  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log("Tabelas encontradas:");
  console.table(result.rows);
  console.log("Banco configurado com sucesso!");
} catch (erro) {
  console.error("Erro ao configurar banco:", erro.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
