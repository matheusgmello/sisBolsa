-- ============================================================
-- SisBolsa - Script de Inicialização (Modo Completo - UUID)
-- Cenário Completo: 1 Admin, 3 Professores, 3 Laboratórios, 7 Bolsistas, 6 Projetos
-- Senha padrão para todos os usuários: 12345678 (hash BCrypt)
-- ============================================================

DROP TABLE IF EXISTS frequencia CASCADE;
DROP TABLE IF EXISTS bolsista_projeto CASCADE;
DROP TABLE IF EXISTS projeto CASCADE;
DROP TABLE IF EXISTS bolsista CASCADE;
DROP TABLE IF EXISTS laboratorio CASCADE;
DROP TABLE IF EXISTS professor CASCADE;

CREATE TABLE professor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'PROFESSOR',
    ativo BOOLEAN DEFAULT TRUE,
    foto_url VARCHAR(255),
    bio TEXT
);

CREATE TABLE laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    area_pesquisa VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Ativo',
    capacidade INTEGER DEFAULT 10,
    coordenador_id UUID REFERENCES professor(id),
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE bolsista (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    curso VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    matricula VARCHAR(50),
    cpf VARCHAR(20),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    laboratorio_id UUID REFERENCES laboratorio(id),
    tipo_usuario VARCHAR(20) DEFAULT 'BOLSISTA',
    foto_url VARCHAR(255),
    cargo VARCHAR(50),
    bio TEXT
);

CREATE TABLE projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    laboratorio_id UUID REFERENCES laboratorio(id),
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE bolsista_projeto (
    bolsista_id UUID REFERENCES bolsista(id) ON DELETE CASCADE,
    projeto_id UUID REFERENCES projeto(id) ON DELETE CASCADE,
    PRIMARY KEY (bolsista_id, projeto_id)
);

CREATE TABLE frequencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bolsista_id UUID REFERENCES bolsista(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    horas_trabalhadas DOUBLE PRECISION NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- Inserção dos Professores (3 Professores)
-- ============================================================
INSERT INTO professor (id, nome, email, senha, tipo_usuario, ativo, foto_url, bio) VALUES
('b1111111-1111-1111-1111-111111111111', 'Dr. Roberto Mendes', 'roberto.mendes@sisbolsa.com', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=11', NULL),
('b2222222-2222-2222-2222-222222222222', 'Dra. Carla Souza',   'carla.souza@sisbolsa.com',   '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=49', NULL),
('b3333333-3333-3333-3333-333333333333', 'Dr. Felipe Andrade', 'felipe.andrade@sisbolsa.com', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=33', NULL);

-- ============================================================
-- Inserção dos Laboratórios (3 Laboratórios)
-- ============================================================
INSERT INTO laboratorio (id, nome, area_pesquisa, status, capacidade, coordenador_id, ativo) VALUES
('c1111111-1111-1111-1111-111111111111', 'Lab de Desenvolvimento de Software', 'Computacao',  'Ativo', 8, 'b1111111-1111-1111-1111-111111111111', true),
('c2222222-2222-2222-2222-222222222222', 'Lab de Ciencias Biologicas',         'Biologia',    'Ativo', 6, 'b2222222-2222-2222-2222-222222222222', true),
('c3333333-3333-3333-3333-333333333333', 'Lab de Engenharia Mecatronica',      'Engenharia',  'Ativo', 7, 'b3333333-3333-3333-3333-333333333333', true);

-- ============================================================
-- Inserção dos Projetos (6 Projetos)
-- ============================================================
INSERT INTO projeto (id, nome, descricao, laboratorio_id, ativo) VALUES
('e1111111-1111-1111-1111-111111111111', 'Sistema de Gestao Academica',              'Desenvolvimento de sistema web para gerenciamento de bolsas e frequencia.', 'c1111111-1111-1111-1111-111111111111', true),
('e1222222-1111-1111-1111-111111111111', 'API de Integracao de Dados Educacionais',  'Criacao de API RESTful para integracao entre plataformas academicas.',      'c1111111-1111-1111-1111-111111111111', true),
('e2111111-2222-2222-2222-222222222222', 'Analise Microbiologica de Solos',          'Mapeamento da diversidade bacteriana em solos do Cerrado.',                  'c2222222-2222-2222-2222-222222222222', true),
('e2222222-2222-2222-2222-222222222222', 'Cultivo de Microalgas para Biocombustivel', 'Otimizacao de fotobiorreatores para producao de lipideos.',                 'c2222222-2222-2222-2222-222222222222', true),
('e3111111-3333-3333-3333-333333333333', 'Robo de Inspecao Industrial',              'Robo movel autonomo equipado com sensores para inspecao de tubulacoes.',    'c3333333-3333-3333-3333-333333333333', true),
('e3222222-3333-3333-3333-333333333333', 'Automacao de Linha de Montagem',           'Sistema de controle CLP e interface SCADA para montagem didatica.',         'c3333333-3333-3333-3333-333333333333', true);

-- ============================================================
-- Inserção do Administrador e dos Bolsistas (1 Admin + 7 Bolsistas)
-- ============================================================
INSERT INTO bolsista (id, nome, senha, data_nascimento, email, curso, matricula, cpf, telefone, ativo, laboratorio_id, tipo_usuario, foto_url, cargo, bio) VALUES
('a1111111-1111-1111-1111-111111111111', 'Carlos Henrique Alencar', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '1988-04-10', 'admin@sisbolsa.com',            'Sistemas de Informacao', 'ADM2024001', '012.345.678-90', '(31) 98800-0001', true, NULL,                                   'ADMIN',    'https://i.pravatar.cc/150?img=60', NULL,            NULL),
('d1111111-1111-1111-1111-111111111111', 'Thiago Rocha',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2001-08-14', 'thiago.rocha@aluno.sisbolsa.com', 'Ciencia da Computacao', '2021102301', '123.456.789-01', '(31) 98811-0001', true, 'c1111111-1111-1111-1111-111111111111', 'BOLSISTA', 'https://i.pravatar.cc/150?img=12', 'DESENVOLVEDOR', NULL),
('d2222222-2222-2222-2222-222222222222', 'Camila Pires',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-03-22', 'camila.pires@aluno.sisbolsa.com', 'Engenharia de Software', '2022104502', '234.567.890-12', '(31) 98822-0002', true, 'c1111111-1111-1111-1111-111111111111', 'BOLSISTA', 'https://i.pravatar.cc/150?img=47', 'PESQUISADOR',   NULL),
('d3333333-1111-1111-1111-111111111111', 'Lucas Martins',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2000-11-05', 'lucas.martins@aluno.sisbolsa.com','Sistemas de Informacao', '2020101103', '345.678.901-23', '(31) 98833-0003', true, 'c1111111-1111-1111-1111-111111111111', 'BOLSISTA', 'https://i.pravatar.cc/150?img=15', 'DESIGNER',      NULL),
('d4444444-2222-2222-2222-222222222222', 'Diego Almeida',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2003-01-30', 'diego.almeida@aluno.sisbolsa.com', 'Biologia',               '2023103304', '456.789.012-34', '(31) 98844-0004', true, 'c2222222-2222-2222-2222-222222222222', 'BOLSISTA', 'https://i.pravatar.cc/150?img=53', 'PESQUISADOR',   NULL),
('d5555555-2222-2222-2222-222222222222', 'Larissa Moura',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-07-18', 'larissa.moura@aluno.sisbolsa.com', 'Biomedicina',            '2022105505', '567.890.123-45', '(31) 98855-0005', true, 'c2222222-2222-2222-2222-222222222222', 'BOLSISTA', 'https://i.pravatar.cc/150?img=44', 'LIDER_TECNICO', NULL),
('d6666666-3333-3333-3333-333333333333', 'Rafael Costa',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2001-12-03', 'rafael.costa@aluno.sisbolsa.com',  'Engenharia de Controle',  '2021106606', '678.901.234-56', '(31) 98866-0006', true, 'c3333333-3333-3333-3333-333333333333', 'BOLSISTA', 'https://i.pravatar.cc/150?img=57', 'DESENVOLVEDOR', NULL),
('d7777777-3333-3333-3333-333333333333', 'Beatriz Lima',            '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-09-25', 'beatriz.lima@aluno.sisbolsa.com',  'Engenharia Mecanica',     '2022107707', '789.012.345-67', '(31) 98877-0007', true, 'c3333333-3333-3333-3333-333333333333', 'BOLSISTA', 'https://i.pravatar.cc/150?img=48', 'PESQUISADOR',   NULL);

-- ============================================================
-- Vinculação Bolsistas aos Projetos
-- ============================================================
INSERT INTO bolsista_projeto (bolsista_id, projeto_id) VALUES
('d1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111'),
('d2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111'),
('d3333333-1111-1111-1111-111111111111', 'e1222222-1111-1111-1111-111111111111'),
('d4444444-2222-2222-2222-222222222222', 'e2111111-2222-2222-2222-222222222222'),
('d5555555-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222'),
('d6666666-3333-3333-3333-333333333333', 'e3111111-3333-3333-3333-333333333333'),
('d7777777-3333-3333-3333-333333333333', 'e3222222-3333-3333-3333-333333333333');

-- ============================================================
-- Histórico de Frequências
-- ============================================================
INSERT INTO frequencia (id, bolsista_id, data, horas_trabalhadas, descricao, ativo) VALUES
('f1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 days', 4.0, 'Configuracao do ambiente Docker e modelagem das entidades JPA.', true),
('f2222222-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '3 days', 5.0, 'Implementacao dos endpoints REST com Spring Boot e validacao DTO.', true),
('f3333333-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '3 days', 4.5, 'Criacao das interfaces de usuario em React e integracao de rotas.', true),
('f4444444-1111-1111-1111-111111111111', 'd3333333-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 days', 4.0, 'Elaboracao dos casos de teste unitario e testes de integracao.', true),
('f5555555-2222-2222-2222-222222222222', 'd4444444-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '2 days', 6.0, 'Coleta e preparo de amostras biologicas em laboratorio.', true),
('f6666666-2222-2222-2222-222222222222', 'd5555555-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day',  5.0, 'Analise de sequenciamento de DNA e tabulacao dos resultados.', true),
('f7777777-3333-3333-3333-333333333333', 'd6666666-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '2 days', 4.0, 'Montagem dos circuitos e calibracao dos sensores do robo.', true),
('f8888888-3333-3333-3333-333333333333', 'd7777777-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '1 day',  5.0, 'Modelagem CAD 3D das pecas e simulacao estrutural de esforcos.', true);
