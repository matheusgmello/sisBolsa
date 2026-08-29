# Guia de Instalação e Execução — SisBolsa

## 📋 Pré-requisitos

| Ferramenta | Versão Recomendada | Finalidade |
|---|---|---|
| **Docker & Docker Compose** | Qualquer versão recente | Execução completa em containers (banco + aplicação) |
| **Java JDK** | 21 | Execução local do backend (opcional caso use Docker) |
| **Maven** | 3.9+ | Build local do backend |
| **Node.js** | 20+ | Desenvolvimento e build do frontend React (opcional caso use Docker) |

---

## 🚀 1. Execução Rápida via Docker (Recomendado)

O Docker Compose sobe automaticamente o banco PostgreSQL e a aplicação com o frontend compilado.

1. Clone o repositório e acerte o diretório:
   ```bash
   git clone <url-do-repositorio>
   cd trabalho-finalp-poow1
   ```

2. Inicie os containers:
   ```bash
   docker compose up -d --build
   ```

3. Acesse a aplicação no navegador:
   👉 **[http://localhost:8080](http://localhost:8080)**

4. Swagger UI / Documentação da API:
   👉 **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**

### Comandos Úteis do Docker
```bash
# Ver logs em tempo real
docker compose logs -f

# Parar a aplicação mantendo os dados
docker compose down

# Parar e resetar o banco de dados do zero
docker compose down -v
```

---

## 🛠️ 2. Execução em Modo de Desenvolvimento

Caso deseje desenvolver com o backend ou frontend rodando localmente:

### Passo 1: Subir o PostgreSQL
```bash
docker compose up -d db
```

### Passo 2: Subir a aplicação Spring Boot
```bash
mvn spring-boot:run
```

### Passo 3 (Opcional): Desenvolver no Frontend com Hot-Reload
Caso deseje editar componentes React com Vite:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 3. Credenciais Iniciais de Acesso

O banco é populado automaticamente via Flyway com as seguintes contas:

### Administrador
- **E-mail:** `admin@sisbolsa.com`
- **Senha:** `12345678`

### Professores Coordenadores
- `roberto.mendes@sisbolsa.com` / `12345678` (Lab. Desenvolvimento de Software)
- `carla.souza@sisbolsa.com` / `12345678` (Lab. Ciências Biológicas)
- `felipe.andrade@sisbolsa.com` / `12345678` (Lab. Engenharia Mecatrônica)

### Bolsistas (Exemplos)
- `thiago.rocha@aluno.sisbolsa.com` / `12345678`
- `camila.pires@aluno.sisbolsa.com` / `12345678`
- `diego.almeida@aluno.sisbolsa.com` / `12345678`
- `bruno.carvalho@aluno.sisbolsa.com` / `12345678`

---

## 🧪 4. Executando os Testes Automatizados

A aplicação possui 83 testes automatizados (unitários, segurança, services e controllers mockados) que rodam sem necessidade de banco ativo:

```bash
mvn test
```
