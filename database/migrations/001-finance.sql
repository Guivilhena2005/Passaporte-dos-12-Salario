CREATE TABLE IF NOT EXISTS finance_records (
 usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 tipo VARCHAR(20) NOT NULL CHECK(tipo IN ('expenses','recurring','habits','contributions','awards','cycles')),
 id VARCHAR(150) NOT NULL,
 payload JSONB NOT NULL,
 PRIMARY KEY(usuario_id,tipo,id)
);
