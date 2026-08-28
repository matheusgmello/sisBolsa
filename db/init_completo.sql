-- ============================================================
-- SisBolsa - Script de Inicialização (Modo Completo / Volume Maior)
-- Cenário Completo: 1 Admin, 3 Professores, 3 Laboratórios, 7 Bolsistas, 6 Projetos
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
-- 2. Inserção dos Professores (3 Professores)
-- ============================================================
INSERT INTO professor (id, nome, email, senha, tipo_usuario, ativo, foto_url, bio) VALUES
(1, 'Dr. Roberto Mendes', 'roberto.mendes@sisbolsa.com', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=11', NULL),
(2, 'Dra. Carla Souza',   'carla.souza@sisbolsa.com',   '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=49', NULL),
(3, 'Dr. Felipe Andrade', 'felipe.andrade@sisbolsa.com', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=33', NULL);

-- ============================================================
-- 3. Inserção dos Laboratórios (3 Laboratórios)
-- ============================================================
INSERT INTO laboratorio (id, nome, area_pesquisa, status, capacidade, coordenador_id, ativo) VALUES
(1, 'Lab de Desenvolvimento de Software', 'Computacao',  'Ativo', 8, 1, true),
(2, 'Lab de Ciencias Biologicas',         'Biologia',    'Ativo', 6, 2, true),
(3, 'Lab de Engenharia Mecatronica',      'Engenharia',  'Ativo', 7, 3, true);

-- ============================================================
-- 4. Inserção dos Projetos (6 Projetos)
-- ============================================================
INSERT INTO projeto (id, nome, descricao, laboratorio_id, ativo) VALUES
(1, 'Sistema de Gestao Academica',              'Desenvolvimento de sistema web para gerenciamento de bolsas e frequencia.', 1, true),
(2, 'API de Integracao de Dados Educacionais',  'Criacao de API RESTful para integracao entre plataformas academicas.',      1, true),
(3, 'Analise Microbiologica de Solos',          'Mapeamento da diversidade bacteriana em solos do Cerrado.',                  2, true),
(4, 'Cultivo de Microalgas para Biocombustivel', 'Otimizacao de fotobiorreatores para producao de lipideos.',                 2, true),
(5, 'Robo de Inspecao Industrial',              'Robo movel autonomo equipado com sensores para inspecao de tubulacoes.',    3, true),
(6, 'Automacao de Linha de Montagem',           'Sistema de controle CLP e interface SCADA para montagem didatica.',         3, true);

-- ============================================================
-- 5. Inserção do Administrador e dos Bolsistas (1 Admin + 7 Bolsistas)
-- ============================================================
INSERT INTO bolsista (id, nome, senha, data_nascimento, email, curso, matricula, cpf, telefone, ativo, laboratorio_id, tipo_usuario, foto_url, cargo, bio) VALUES
(1, 'Carlos Henrique Alencar', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '1988-04-10', 'admin@sisbolsa.com',            'Sistemas de Informacao', 'ADM2024001', '012.345.678-90', '(31) 98800-0001', true, NULL, 'ADMIN',    'https://i.pravatar.cc/150?img=60', NULL,            NULL),
(2, 'Thiago Rocha',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2001-08-14', 'thiago.rocha@aluno.sisbolsa.com', 'Ciencia da Computacao', '2021102301', '123.456.789-01', '(31) 98811-0001', true, 1,    'BOLSISTA', 'https://i.pravatar.cc/150?img=12', 'DESENVOLVEDOR', NULL),
(3, 'Camila Pires',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-03-22', 'camila.pires@aluno.sisbolsa.com', 'Engenharia de Software', '2022104502', '234.567.890-12', '(31) 98822-0002', true, 1,    'BOLSISTA', 'https://i.pravatar.cc/150?img=47', 'PESQUISADOR',   NULL),
(4, 'Lucas Martins',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2000-11-05', 'lucas.martins@aluno.sisbolsa.com','Sistemas de Informacao', '2020101103', '345.678.901-23', '(31) 98833-0003', true, 1,    'BOLSISTA', 'https://i.pravatar.cc/150?img=15', 'DESIGNER',      NULL),
(5, 'Diego Almeida',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2003-01-30', 'diego.almeida@aluno.sisbolsa.com', 'Biologia',               '2023103304', '456.789.012-34', '(31) 98844-0004', true, 2,    'BOLSISTA', 'https://i.pravatar.cc/150?img=53', 'PESQUISADOR',   NULL),
(6, 'Larissa Moura',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-07-18', 'larissa.moura@aluno.sisbolsa.com', 'Biomedicina',            '2022105505', '567.890.123-45', '(31) 98855-0005', true, 2,    'BOLSISTA', 'https://i.pravatar.cc/150?img=44', 'LIDER_TECNICO', NULL),
(7, 'Rafael Costa',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2001-12-03', 'rafael.costa@aluno.sisbolsa.com',  'Engenharia de Controle',  '2021106606', '678.901.234-56', '(31) 98866-0006', true, 3,    'BOLSISTA', 'https://i.pravatar.cc/150?img=57', 'DESENVOLVEDOR', NULL),
(8, 'Beatriz Lima',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-09-25', 'beatriz.lima@aluno.sisbolsa.com',  'Engenharia Mecanica',     '2022107707', '789.012.345-67', '(31) 98877-0007', true, 3,    'BOLSISTA', 'https://i.pravatar.cc/150?img=48', 'PESQUISADOR',   NULL);

-- ============================================================
-- 6. Vinculação Bolsistas aos Projetos
-- ============================================================
INSERT INTO bolsista_projeto (bolsista_id, projeto_id) VALUES
(2, 1), (3, 1), (4, 2),
(5, 3), (6, 4),
(7, 5), (8, 6);

-- ============================================================
-- 7. Histórico de Frequências
-- ============================================================
INSERT INTO frequencia (bolsista_id, data, horas_trabalhadas, descricao, ativo) VALUES
(2, CURRENT_DATE - INTERVAL '4 days', 4.0, 'Configuracao do ambiente Docker e modelagem das entidades JPA.', true),
(2, CURRENT_DATE - INTERVAL '3 days', 5.0, 'Implementacao dos endpoints REST com Spring Boot e validacao DTO.', true),
(3, CURRENT_DATE - INTERVAL '3 days', 4.5, 'Criacao das interfaces de usuario em React e integracao de rotas.', true),
(4, CURRENT_DATE - INTERVAL '2 days', 4.0, 'Elaboracao dos casos de teste unitario e testes de integracao.', true),
(5, CURRENT_DATE - INTERVAL '2 days', 6.0, 'Coleta e preparo de amostras biologicas em laboratorio.', true),
(6, CURRENT_DATE - INTERVAL '1 day',  5.0, 'Analise de sequenciamento de DNA e tabulacao dos resultados.', true),
(7, CURRENT_DATE - INTERVAL '2 days', 4.0, 'Montagem dos circuitos e calibracao dos sensores do robo.', true),
(8, CURRENT_DATE - INTERVAL '1 day',  5.0, 'Modelagem CAD 3D das pecas e simulacao estrutural de esforcos.', true);

-- ============================================================
-- Ajuste das Sequences
-- ============================================================
SELECT setval('professor_id_seq', (SELECT MAX(id) FROM professor));
SELECT setval('laboratorio_id_seq', (SELECT MAX(id) FROM laboratorio));
SELECT setval('bolsista_id_seq', (SELECT MAX(id) FROM bolsista));
SELECT setval('projeto_id_seq', (SELECT MAX(id) FROM projeto));
SELECT setval('frequencia_id_seq', (SELECT MAX(id) FROM frequencia));
