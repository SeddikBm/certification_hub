# Stage 1: Multi-stage build pour le backend Spring Boot (Java 21)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copie du pom.xml et téléchargement des dépendances
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copie du code source et compilation
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image légère
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copie de l'artefact compilé
COPY --from=builder /app/target/certificationHub-0.0.1-SNAPSHOT.jar app.jar

# Exposition du port 9090
EXPOSE 9090

ENTRYPOINT ["java", "-jar", "app.jar"]
