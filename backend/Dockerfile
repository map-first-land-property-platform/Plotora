FROM amazoncorretto:21-alpine

WORKDIR /app

COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

RUN addgroup -S spring \
    && adduser -S spring -G spring \
    && chown spring:spring app.jar

USER spring

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
