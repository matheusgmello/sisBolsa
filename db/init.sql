-- ============================================================
-- SisBolsa - Script de Inicialização Padrão (Cenário Apresentação)
-- Banco de Dados: PostgreSQL
-- Chaves Primárias: UUID nativo com gen_random_uuid()
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS auditoria CASCADE;
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
    tipo_usuario VARCHAR(20) DEFAULT 'PROFESSOR',
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
    modalidade_bolsa VARCHAR(50),
    valor_bolsa NUMERIC(10,2),
    data_inicio_bolsa DATE,
    data_fim_bolsa DATE,
    bio TEXT
);

CREATE TABLE projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    laboratorio_id UUID REFERENCES laboratorio(id),
    link_repositorio VARCHAR(500),
    link_documentacao VARCHAR(500),
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
    link_comprovante VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    usuario_nome VARCHAR(255),
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(50) NOT NULL,
    detalhes TEXT,
    ip_origem VARCHAR(100),
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_data_hora ON auditoria(data_hora DESC);
CREATE INDEX idx_auditoria_entidade ON auditoria(entidade);

-- ============================================================
-- Inserção dos Dados de Apresentação
-- ============================================================
INSERT INTO professor (id, nome, email, senha, tipo_usuario, ativo, foto_url, bio) VALUES
('b1111111-1111-1111-1111-111111111111', 'Dr. Roberto Mendes', 'roberto.mendes@sisbolsa.com', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=11', NULL),
('b2222222-2222-2222-2222-222222222222', 'Dra. Carla Souza',   'carla.souza@sisbolsa.com',   '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', 'PROFESSOR', true, 'https://i.pravatar.cc/150?img=49', NULL);

INSERT INTO laboratorio (id, nome, area_pesquisa, status, capacidade, coordenador_id, ativo) VALUES
('c1111111-1111-1111-1111-111111111111', 'Lab de Desenvolvimento de Software',      'Ciência da Computação', 'Ativo', 8, 'b1111111-1111-1111-1111-111111111111', true),
('c2222222-2222-2222-2222-222222222222', 'Lab de Inteligência Artificial e Dados', 'Ciência de Dados',      'Ativo', 6, 'b2222222-2222-2222-2222-222222222222', true);

INSERT INTO bolsista (id, nome, senha, data_nascimento, email, curso, matricula, cpf, telefone, ativo, laboratorio_id, tipo_usuario, foto_url, cargo, modalidade_bolsa, valor_bolsa, data_inicio_bolsa, data_fim_bolsa, bio) VALUES
('a1111111-1111-1111-1111-111111111111', 'Carlos Henrique Alencar', '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '1988-04-10', 'admin@sisbolsa.com',            'Sistemas de Informação', 'ADM2024001', '012.345.678-90', '(31) 98800-0001', true, NULL,                                   'ADMIN',    'https://i.pravatar.cc/150?img=60', NULL,            NULL,          NULL,   NULL,                                 NULL,                               NULL),
('d1111111-1111-1111-1111-111111111111', 'Lucas Oliveira',          '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2002-05-15', 'lucas.oliveira@aluno.sisbolsa.com', 'Ciência da Computação', '20221001',   '111.222.333-44', '(31) 99111-2233', true, 'c1111111-1111-1111-1111-111111111111', 'BOLSISTA', 'https://i.pravatar.cc/150?img=12', 'DESENVOLVEDOR', 'PIBIC',        700.00, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months',  NULL),
('d2222222-2222-2222-2222-222222222222', 'Mariana Santos',          '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2001-11-20', 'mariana.santos@aluno.sisbolsa.com', 'Engenharia de Software', '20211002',   '222.333.444-55', '(31) 99222-3344', true, 'c1111111-1111-1111-1111-111111111111', 'BOLSISTA', 'https://i.pravatar.cc/150?img=47', 'PESQUISADOR',   'PIBITI',       700.00, CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months',  NULL),
('d3333333-3333-3333-3333-333333333333', 'Diego Almeida',           '$2a$10$bTT.MiXD1zXSLvIxrMQqV.YR2nTjqkSpwD6P3Cjn3XyZCamHk2BO2', '2003-02-28', 'diego.almeida@aluno.sisbolsa.com',  'Sistemas de Informação', '20231003',   '333.444.555-66', '(31) 99333-4455', true, 'c2222222-2222-2222-2222-222222222222', 'BOLSISTA', 'https://i.pravatar.cc/150?img=33', 'DESIGNER',      'EXTENSAO',     500.00, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', NULL);

INSERT INTO projeto (id, nome, descricao, laboratorio_id, link_repositorio, link_documentacao, ativo) VALUES
('e1111111-1111-1111-1111-111111111111', 'Sistema Web de Gestão Acadêmica',          'Desenvolvimento de plataforma web para controle de bolsas de pesquisa e auditoria.', 'c1111111-1111-1111-1111-111111111111', 'https://github.com/exemplo/sistema-web-gestao', 'https://overleaf.com/read/exemplo-artigo-academico', true),
('e2222222-2222-2222-2222-222222222222', 'Modelagem Preditiva com Machine Learning', 'Pesquisa e implementação de algoritmos de classificação em bases de dados abertas.', 'c2222222-2222-2222-2222-222222222222', 'https://github.com/exemplo/modelagem-ml-pesquisa', 'https://notion.so/exemplo-documentacao-dados', true);

INSERT INTO bolsista_projeto (bolsista_id, projeto_id) VALUES
('d1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111'),
('d2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111'),
('d3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222');

INSERT INTO frequencia (id, bolsista_id, data, horas_trabalhadas, descricao, link_comprovante, ativo) VALUES
('f1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 days', 4.0, 'Implementação de autenticação JWT e testes de endpoints.', 'https://github.com/exemplo/sistema-web-gestao/pull/12', true),
('f2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day',  4.0, 'Criação dos componentes de tabela e modais no frontend React.', 'https://github.com/exemplo/sistema-web-gestao/commit/a1b2c3d', true),
('f3333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '2 days', 5.0, 'Revisão bibliográfica e elaboração do plano de testes da plataforma.', NULL, true),
('f4444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', CURRENT_DATE,                     4.0, 'Mapeamento de casos de uso e validação de requisitos com a equipe.', NULL, true),
('f5555555-5555-5555-5555-555555555555', 'd3333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '1 day',  6.0, 'Limpeza e pré-processamento do dataset para o modelo preditivo.', NULL, true);

INSERT INTO auditoria (id, usuario_id, usuario_nome, acao, entidade, detalhes, ip_origem, data_hora) VALUES
('aa111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Carlos Henrique Alencar', 'LOGIN', 'AUTH', 'Login efetuado com sucesso no painel administrativo.', '127.0.0.1', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('aa222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Carlos Henrique Alencar', 'CRIAR_LABORATORIO', 'LABORATORIO', 'Cadastro do Lab de Desenvolvimento de Software coordenado pelo Dr. Roberto Mendes.', '127.0.0.1', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('aa333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Dr. Roberto Mendes', 'CRIAR_PROJETO', 'PROJETO', 'Criado projeto "Sistema Web de Gestão Acadêmica".', '192.168.1.10', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('aa444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Dr. Roberto Mendes', 'VINCULAR_BOLSISTA', 'PROJETO', 'Bolsista Lucas Oliveira vinculado ao projeto "Sistema Web de Gestão Acadêmica".', '192.168.1.10', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('aa555555-5555-5555-5555-555555555555', 'd1111111-1111-1111-1111-111111111111', 'Lucas Oliveira', 'REGISTRAR_FREQUENCIA', 'FREQUENCIA', 'Apontamento de 4.0h de pesquisa com link de PR no GitHub.', '192.168.1.15', CURRENT_TIMESTAMP - INTERVAL '2 hours');
