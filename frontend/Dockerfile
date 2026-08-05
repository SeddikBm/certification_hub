# Stage 1: Build de l'application React Vite
FROM node:20-alpine AS builder
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Copie des sources et build de production
COPY . .
RUN npm run build

# Stage 2: Service des fichiers statiques via Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
