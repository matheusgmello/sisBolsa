-- ============================================================
-- SisBolsa - Script de Inicialização (Modo Apresentação)
-- Cenário Enxuto: 1 Admin, 2 Professores, 2 Laboratórios, 3 Bolsistas
-- Senha padrão para todos os usuários: 12345678 (hash BCrypt)
-- ============================================================

-- 1. Criação das Tabelas (Schema)
DROP TABLE IF EXISTS frequencia CASCADE;
DROP TABLE IF EXISTS bolsista_projeto CASCADE;
DROP TABLE IF EXISTS projeto CASCADE;
DROP TABLE IF EXISTS bolsista CASCADE;
DROP TABLE IF EXISTS laboratorio CASCADE;
DROP TABLE IF EXISTS professor CASCADE;

CREATE TABLE professor (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'PROFESSOR',
    ativo BOOLEAN DEFAULT TRUE,
    foto_url VARCHAR(255),
    bio TEXT
);

CREATE TABLE laboratorio (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    area_pesquisa VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Ativo',
    capacidade INTEGER DEFAULT 10,
    coordenador_id INTEGER REFERENCES professor(id),
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE bolsista (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    curso VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    matricula VARCHAR(50),
    cpf VARCHAR(20),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    laboratorio_id INTEGER REFERENCES laboratorio(id),
    tipo_usuario VARCHAR(20) DEFAULT 'BOLSISTA',
    foto_url VARCHAR(255),
    cargo VARCHAR(50),
    bio TEXT
);

CREATE TABLE projeto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    laboratorio_id INTEGER REFERENCES laboratorio(id),
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE bolsista_projeto (
    bolsista_id INTEGER REFERENCES bolsista(id) ON DELETE CASCADE,
    projeto_id INTEGER REFERENCES projeto(id) ON DELETE CASCADE,
    PRIMARY KEY (bolsista_id, projeto_id)
);

CREATE TABLE frequencia (
    id SERIAL PRIMARY KEY,
    bolsista_id INTEGER REFERENCES bolsista(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    horas_trabalhadas DOUBLE PRECISION NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- 2. Inserção dos Professores (2 Professores)
-- ============================================================
INSERT INTO professor (id, nome, email, senha, tipo_usuario, ativo, foto_url, bio) VALUES
(1, 'Dr. Roberto Mendes', 'roberto.mendes@sisbolsa.com', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=11', NULL),
(2, 'Dra. Carla Souza',   'carla.souza@sisbolsa.com',   '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=49', NULL);

-- ============================================================
-- 3. Inserção dos Laboratórios (2 Laboratórios coordenados)
-- ============================================================
INSERT INTO laboratorio (id, nome, area_pesquisa, status, capacidade, coordenador_id, ativo) VALUES
(1, 'Lab de Desenvolvimento de Software',      'Ciência da Computação', 'Ativo', 8, 1, true),
(2, 'Lab de Inteligência Artificial e Dados', 'Ciência de Dados',      'Ativo', 6, 2, true);

-- ============================================================
-- 4. Inserção do Administrador e dos Bolsistas (1 Admin + 3 Bolsistas)
-- ============================================================
INSERT INTO bolsista (id, nome, senha, data_nascimento, email, curso, matricula, cpf, telefone, ativo, laboratorio_id, tipo_usuario, foto_url, cargo, bio) VALUES
-- Administrador Geral (ID 1)
(1, 'Carlos Henrique Alencar', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '1988-04-10', 'admin@sisbolsa.com', 'Sistemas de Informação', 'ADM2024001', '012.345.678-90', '(31) 98800-0001', true, NULL, 'ADMIN', 'https://i.pravatar.cc/150?img=60', NULL, NULL),

-- Bolsista 1 - Lab 1 (ID 2)
(2, 'Lucas Oliveira',          '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-05-15', 'lucas.oliveira@aluno.sisbolsa.com', 'Ciência da Computação', '20221001', '111.222.333-44', '(31) 99111-2233', true, 1, 'BOLSISTA', 'https://i.pravatar.cc/150?img=12', 'DESENVOLVEDOR', NULL),

-- Bolsista 2 - Lab 1 (ID 3)
(3, 'Mariana Santos',          '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2001-11-20', 'mariana.santos@aluno.sisbolsa.com', 'Engenharia de Software', '20211002', '222.333.444-55', '(31) 99222-3344', true, 1, 'BOLSISTA', 'https://i.pravatar.cc/150?img=47', 'PESQUISADOR', NULL),

-- Bolsista 3 - Lab 2 (ID 4)
(4, 'Diego Almeida',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2003-02-28', 'diego.almeida@aluno.sisbolsa.com', 'Sistemas de Informação', '20231003', '333.444.555-66', '(31) 99333-4455', true, 2, 'BOLSISTA', 'https://i.pravatar.cc/150?img=33', 'DESIGNER', NULL);

-- ============================================================
-- 5. Inserção dos Projetos (1 projeto por laboratório)
-- ============================================================
INSERT INTO projeto (id, nome, descricao, laboratorio_id, ativo) VALUES
(1, 'Sistema Web de Gestão Acadêmica',          'Desenvolvimento de plataforma web para controle de bolsas de pesquisa e auditoria.', 1, true),
(2, 'Modelagem Preditiva com Machine Learning', 'Pesquisa e implementação de algoritmos de classificação em bases de dados abertas.', 2, true);

-- ============================================================
-- 6. Vinculação de Bolsistas aos Projetos
-- ============================================================
INSERT INTO bolsista_projeto (bolsista_id, projeto_id) VALUES
(2, 1), -- Lucas no Projeto 1
(3, 1), -- Mariana no Projeto 1
(4, 2); -- Diego no Projeto 2

-- ============================================================
-- 7. Histórico de Frequência de Exemplo
-- ============================================================
INSERT INTO frequencia (bolsista_id, data, horas_trabalhadas, descricao, ativo) VALUES
(2, CURRENT_DATE - INTERVAL '2 days', 4.0, 'Implementação de autenticação JWT e testes de endpoints.', true),
(2, CURRENT_DATE - INTERVAL '1 day',  4.0, 'Criação dos componentes de tabela e modais no frontend React.', true),
(3, CURRENT_DATE - INTERVAL '2 days', 5.0, 'Revisão bibliográfica e elaboração do plano de testes da plataforma.', true),
(3, CURRENT_DATE,                     4.0, 'Mapeamento de casos de uso e validação de requisitos com a equipe.', true),
(4, CURRENT_DATE - INTERVAL '1 day',  6.0, 'Limpeza e pré-processamento do dataset para o modelo preditivo.', true);

-- ============================================================
-- Ajuste das Sequences dos IDs
-- ============================================================
SELECT setval('professor_id_seq', (SELECT MAX(id) FROM professor));
SELECT setval('laboratorio_id_seq', (SELECT MAX(id) FROM laboratorio));
SELECT setval('bolsista_id_seq', (SELECT MAX(id) FROM bolsista));
SELECT setval('projeto_id_seq', (SELECT MAX(id) FROM projeto));
SELECT setval('frequencia_id_seq', (SELECT MAX(id) FROM frequencia));
