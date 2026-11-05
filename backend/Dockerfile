FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /build
COPY pom.xml .
COPY src src
RUN mvn -B package -DskipTests

FROM amazoncorretto:21-alpine

WORKDIR /app

COPY --from=build /build/target/backend-0.0.1-SNAPSHOT.jar app.jar

RUN addgroup -S spring \
    && adduser -S spring -G spring \
    && mkdir -p /app/uploads \
    && chown spring:spring app.jar /app/uploads

USER spring

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
