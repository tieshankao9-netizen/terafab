FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server/package*.json ./server/
RUN npm --prefix server install

COPY . .

RUN npm run build && npm run build:server

EXPOSE 3001

CMD ["npm", "start"]
