# Blocks Release builds the app from this file: a static Vite build served by nginx.
FROM node:22-alpine AS builder
WORKDIR /app
# Electron is only for the desktop package; skip its binary so the web build stays small.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx vite build

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
