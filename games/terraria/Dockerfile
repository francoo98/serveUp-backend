FROM ubuntu:noble

WORKDIR /root/

EXPOSE 7777

COPY ./server /root/server
COPY ./start_server.exp /root/

RUN apt update && apt install -y expect

CMD [ "expect", "/root/start_server.exp" ]