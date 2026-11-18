# Configuração MySQL

1. Rode `database/schema.sql` no MySQL Workbench ou terminal.
2. Crie um usuário específico da aplicação, alterando a senha do exemplo:

```sql
CREATE USER 'passaporte_app'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';
GRANT SELECT, INSERT, UPDATE, DELETE ON passaporte_12_salarios.* TO 'passaporte_app'@'localhost';
```

3. Copie `.env.example` para `.env`, configure `DB_USER`, `DB_PASSWORD`, `DB_NAME` e gere um `SESSION_SECRET` aleatório de pelo menos 32 caracteres.
4. Execute `npm install` e `npm start`.
5. Acesse `http://localhost:3000/pages/login.html`.

**Segurança:** senha do usuário é armazenada somente como hash bcrypt; sessões ficam no MySQL e usam cookie HttpOnly/SameSite. A API filtra os dados pelo ID da sessão. O arquivo `.env` não deve ir ao GitHub. Em produção, HTTPS e configurações de proxy são necessários. Não há redefinição de senha nem confirmação de e-mail nesta entrega.
