FROM node:22-alpine

# SAB Lanyard Backend
WORKDIR /app

ARG NODE_ENV=development
ARG PORT=5000
ARG BASE_URL=http://localhost:5000
ARG MONGODB_URI=mongodb://admin:password123@localhost:27017/minipreorder?authSource=admin
ARG JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

ARG ADMIN_USERNAME=admin
ARG ADMIN_PASSWORD=admin123
ARG ADMIN_EMAIL=sab@fit.hcmus.edu.vn

# App Script Google Forms
ARG APPSCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec

# CORS
ARG CORS_ORIGIN=http://localhost:3000

ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT
ENV BASE_URL=$BASE_URL
ENV MONGODB_URI=$MONGODB_URI
ENV JWT_SECRET=$JWT_SECRET
ENV ADMIN_USERNAME=$ADMIN_USERNAME
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD
ENV ADMIN_EMAIL=$ADMIN_EMAIL
ENV APPSCRIPT_URL=$APPSCRIPT_URL
ENV CORS_ORIGIN=$CORS_ORIGIN

COPY package*.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 5000

# Initialize database and start server
RUN yarn init-db
CMD ["yarn", "start"]
