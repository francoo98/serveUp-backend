FROM node:current

WORKDIR /app

COPY api.js ./
COPY gameServerCreators.js ./
COPY servers-api.js ./
COPY users-api.js ./
COPY package.json ./

RUN npm install

EXPOSE 3000

CMD [ "node", "api.js" ]