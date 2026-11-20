# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Stage 2: Build Spring Boot backend
FROM eclipse-temurin:17-jdk AS backend-build

WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

COPY src ./src

# Include React production files in Spring Boot
COPY --from=frontend-build /frontend/dist/ ./src/main/resources/static/

RUN ./mvnw clean package -DskipTests


# Stage 3: Run application
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=backend-build /app/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
