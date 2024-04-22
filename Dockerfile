FROM ubuntu:latest

WORKDIR /app

COPY api.js ./
COPY package.json ./

RUN apt update
RUN apt install -y curl
# install nodejs
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
RUN npm install

EXPOSE 3000

CMD [ "node", "api.js" ]