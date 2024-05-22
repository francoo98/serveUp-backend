FROM eclipse-temurin:21

RUN adduser minecraft
USER minecraft
WORKDIR /home/minecraft
RUN wget https://api.papermc.io/v2/projects/paper/versions/1.8.8/builds/445/downloads/paper-1.8.8-445.jar
RUN echo "eula=true" > eula.txt

COPY ./server.properties ./

EXPOSE 25565

CMD [ "java", "-Xmx2G", "-Xms2G", "-jar", "paper-1.8.8-445.jar", "noguis" ]