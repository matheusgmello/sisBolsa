# estagio 1: build do frontend react com vite
FROM node:20-alpine AS frontend-build
WORKDIR /app/sisbolsa-web

COPY sisbolsa-web/package*.json ./
RUN npm ci

COPY sisbolsa-web/ ./
RUN npm run build

# estagio 2: build da aplicacao spring boot com maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY sisbolsa-api/pom.xml .
RUN mvn -B dependency:go-offline

COPY sisbolsa-api/src ./src
# substitui os arquivos estaticos pelo bundle compilado do react
COPY --from=frontend-build /app/sisbolsa-api/src/main/resources/static ./src/main/resources/static

RUN mvn -B clean package -DskipTests

# estagio 3: imagem final de execucao jre
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --create-home --shell /usr/sbin/nologin sisbolsa
USER sisbolsa

COPY --from=build --chown=sisbolsa:sisbolsa /build/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
