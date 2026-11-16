FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

ENV API_UPSTREAM=http://localhost:8000
EXPOSE 80
