-- Personal App — Schema PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  senha_hash  VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pesos (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  peso       NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, data)
);

CREATE TABLE IF NOT EXISTS pressoes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  manha      VARCHAR(20),
  noite      VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, data)
);

CREATE TABLE IF NOT EXISTS diario (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  nota       TEXT,
  besteira   TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, data)
);

CREATE TABLE IF NOT EXISTS dieta (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  refeicao_id VARCHAR(50) NOT NULL,
  concluida   BOOLEAN DEFAULT FALSE,
  opcao_idx   SMALLINT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, data, refeicao_id)
);

CREATE TABLE IF NOT EXISTS treinos (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data       DATE NOT NULL,
  dia        VARCHAR(2) NOT NULL,
  duracao    INTEGER,
  gasto      VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, data, dia)
);

CREATE TABLE IF NOT EXISTS treino_series (
  id         SERIAL PRIMARY KEY,
  treino_id  INTEGER REFERENCES treinos(id) ON DELETE CASCADE,
  exercicio  VARCHAR(100) NOT NULL,
  serie_num  SMALLINT NOT NULL,
  kg         NUMERIC(6,2),
  reps       SMALLINT,
  comentario TEXT
);
