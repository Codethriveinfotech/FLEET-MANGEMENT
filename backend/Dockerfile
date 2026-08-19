# Build stage
FROM gradle:8.9-jdk17 AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN chmod +x ./gradlew
RUN ./gradlew :backend:buildFatJar --no-daemon

# Run stage
FROM eclipse-temurin:17-jre
EXPOSE 8080
RUN mkdir /app
COPY --from=build /home/gradle/src/backend/build/libs/*.jar /app/ktor-app.jar
ENTRYPOINT ["sh", "-c", "java -jar /app/ktor-app.jar -port=${PORT:-8080}"]
