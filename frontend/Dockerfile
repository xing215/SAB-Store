FROM node:22-alpine

# SAB Lanyard Frontend
WORKDIR /app

COPY package*.json *.lock ./

RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
