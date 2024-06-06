FROM ubuntu:focal

WORKDIR /root/

EXPOSE 26000/udp

RUN apt-get update
RUN apt-get install -y curl unzip
RUN curl https://dl.xonotic.org/xonotic-0.8.6.zip -o xonotic-0.8.6.zip
RUN unzip xonotic-0.8.6.zip
RUN mkdir .xonotic && mkdir .xonotic/data/
RUN mv /root/Xonotic/server/server_linux.sh /root/Xonotic
RUN apt-get clean

COPY ./server.cfg /root/
COPY start.sh /

CMD [ "/start.sh" ]