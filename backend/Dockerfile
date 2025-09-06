FROM node:22-alpine

# SAB Lanyard Backend
WORKDIR /app

COPY package*.json *.lock  ./

RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 5000

CMD ["yarn", "start"]
