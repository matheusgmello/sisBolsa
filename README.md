# SisBolsa — Gestão de Bolsistas e Laboratórios

Sistema web para gestão integrada de bolsistas de pesquisa, professores orientadores, laboratórios, projetos acadêmicos, controle de frequência e trilha de auditoria.

API RESTful construída em **Spring Boot 4 / Java 21** com frontend Single Page Application (SPA) moderno em **React + Vite + TypeScript**.

---

## 🚀 Tecnologias

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Lucide React, Recharts (gráficos interativos) |
| **Backend** | Spring Boot 4.0.6, Java 21, Spring Data JPA, Hibernate |
| **Segurança** | Spring Security, JWT em Cookie `httpOnly`, BCrypt, Rate Limiting anti-bruteforce |
| **Banco de Dados** | PostgreSQL 15, Flyway Migration |
| **Documentação** | OpenAPI 3 / Swagger UI (springdoc 3.1.0) |
| **Relatórios** | LibrePDF / OpenPDF (geração nativa de comprovantes em PDF) |
| **Infraestrutura** | Docker, Docker Compose (Build multi-stage) |

---

## 🌟 Principais Funcionalidades

1. **Gestão de Bolsistas e Vínculos:**
   - Cadastro completo de bolsistas, vigência de bolsa (início/término), modalidades (`PIBIC`, `PIBITI`, `Extensão`, `Monitoria`, etc.) e valor mensal da bolsa (R$).
   - Controle de status de vencimento da bolsa com avisos visuais.
   - Atribuição de cargos acadêmicos e lotação em laboratórios.

2. **Laboratórios & Controle de Capacidade:**
   - Cadastro de laboratórios de pesquisa vinculados a professores coordenadores.
   - Indicadores visuais de percentual de ocupação em tempo real (com avisos de lotação).

3. **Projetos de Pesquisa & Entregáveis:**
   - Gestão de projetos por laboratório e vinculação de membros da equipe.
   - Links diretos para entregáveis externos (repositórios GitHub/GitLab, artigos Overleaf e documentações).

4. **Controle de Frequência & Horas:**
   - Apontamento de horas trabalhadas com descrição de tarefas e link de entregáveis/PRs.
   - Filtros por intervalo de datas e exportação de relatórios em formato CSV.
   - **Emissão de Comprovante Oficial em PDF:** Geração de documento institucional A4 com resumo do bolsista, tabela zebrada de apontamentos e campos para assinatura do bolsista e coordenador.

5. **Relatórios & Estatísticas (Admin):**
   - Gráficos interativos com Recharts (Ocupação dos labs, distribuição de cargos, horas trabalhadas no mês e projetos por laboratório).
   - Alternância rápida entre visualização gráfica e tabular.

6. **Trilha de Auditoria (Audit Log):**
   - Rastreamento centralizado de ações críticas (logins, alterações cadastrais, cadastros, exclusões e emissão de comprovantes).
   - Filtros por entidade, tipo de ação, datas e exportação em CSV.

7. **Segurança & Controle de Acesso (RBAC):**
   - Três perfis bem definidos: `ADMIN`, `PROFESSOR` e `BOLSISTA`.
   - **Rate Limiting no Login:** Bloqueio temporário de 5 minutos após 5 falhas consecutivas de autenticação.
   - **Fluxo de "Esqueci a Senha":** Recuperação segura de senha através de código de verificação temporário.
   - **Perfil & Segurança:** Medidor dinâmico de força de senha, validação em tempo real e alteração segura exigindo senha atual.
   - **Modo Escuro (Dark Mode):** Alternador de tema Claro / Escuro com persistência no `localStorage`.

---

## 🔒 Perfis de Acesso

- **`ADMIN`:** Acesso irrestrito a todos os laboratórios, bolsistas, projetos, relatórios globais, trilha de auditoria e configurações.
- **`PROFESSOR`:** Gerenciamento dos laboratórios que coordena, seus projetos associados e bolsistas vinculados.
- **`BOLSISTA`:** Apontamento e edição de frequência própria, visualização de equipe/projetos do laboratório e emissão de comprovantes em PDF.

---

## 🏃 Como Rodar

### Com Docker (Recomendado)

```bash
docker compose up -d --build
```

Acesse a aplicação em: **[http://localhost:8080](http://localhost:8080)**

### Desenvolvimento Local

```bash
# 1. Subir apenas o banco de dados
docker compose up -d db

# 2. Rodar a aplicação Spring Boot
mvn spring-boot:run

# (Opcional) Para rodar o frontend com hot-reload no Vite:
cd frontend && npm run dev
```

### Acesso Inicial

```
E-mail: admin@sisbolsa.com
Senha:  12345678
```

---

## 📚 Documentação da API (Swagger)

Com a aplicação rodando, acesse a documentação interativa:
- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## 🧪 Testes Automatizados

A suíte conta com 83 testes automatizados (unitários e de contexto com mockMvc) que não dependem de banco de dados externo:

```bash
mvn test
```
