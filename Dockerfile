FROM node:latest

WORKDIR /app

COPY ./ .

RUN npm install

RUN mkdir uploads

CMD [ "node", "index.js", "initData" ]