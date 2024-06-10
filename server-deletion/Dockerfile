FROM node:lts

WORKDIR /app

COPY ./package.json ./
COPY ./main.js ./

RUN npm install

CMD ["node", "main.js"]