# Postman

`SisBolsa-API.postman.json` e a especificacao OpenAPI 3 exportada direto do
`/v3/api-docs` da aplicacao rodando. Nao e uma colecao escrita a mao: e o
mesmo contrato que o springdoc gera a partir das anotacoes `@Operation` e
`@Schema` do codigo, entao nunca fica desatualizada em relacao a API de
verdade — regenerar e so exportar de novo.

## Importar

1. Suba a aplicacao (`docker compose up -d` ou `mvn spring-boot:run` dentro
   de `sisbolsa-api`).
2. No Postman: **Import** → arraste `SisBolsa-API.postman.json` (ou aponte
   direto para `http://localhost:8080/v3/api-docs` pela URL) → **Import**.
3. O Postman converte sozinho para colecao, com uma pasta por tag
   (Autenticacao, Bolsistas & Usuarios, Laboratorios, Projetos, Frequencia &
   Horas, Relatorios & Estatisticas, Auditoria) e os corpos de requisicao ja
   preenchidos com os exemplos dos DTOs.

## Autenticacao

A API usa JWT em cookie `httpOnly` (nao Bearer token). Fluxo no Postman:

1. Rode `POST Autenticacao → Autenticar usuario` com um e-mail e senha
   validos (seed: `admin@sisbolsa.com` / `12345678`).
2. O Postman guarda o cookie `Set-Cookie` da resposta no proprio cookie jar
   automaticamente.
3. Toda chamada seguinte para `localhost:8080` na mesma sessao do Postman ja
   sai autenticada — nao precisa copiar token em lugar nenhum.

## Base URL

A colecao vem com `http://localhost:8080` fixado (e o `server` declarado no
OpenAPI). Para apontar para outro host, edite a variavel de URL base que o
Postman cria na importacao.

## Regenerar

```bash
curl -s http://localhost:8080/v3/api-docs | python3 -m json.tool > postman/SisBolsa-API.postman.json
```
