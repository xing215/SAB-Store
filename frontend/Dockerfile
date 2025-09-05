FROM node:18-alpine

# SAB Lanyard Frontend
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
