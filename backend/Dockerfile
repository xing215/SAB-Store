FROM node:18-alpine

# SAB Lanyard Backend
WORKDIR /app

COPY package*.json ./

RUN yarn ci --only=production

COPY . .

EXPOSE 5000

USER node

CMD ["yarn", "start"]
