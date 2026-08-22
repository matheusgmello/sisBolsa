# build em estagio separado: a imagem final nao carrega maven nem codigo fonte
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# as dependencias mudam bem menos que o codigo. copiar so o pom primeiro faz o
# docker reaproveitar a camada de download quando so o fonte muda.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

# nao rodar como root: se alguem escapar da aplicacao, escapa sem privilegio
RUN useradd --system --create-home --shell /usr/sbin/nologin sisbolsa
USER sisbolsa

COPY --from=build --chown=sisbolsa:sisbolsa /build/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
