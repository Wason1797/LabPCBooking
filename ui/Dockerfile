# Stage 1: build the Vite app (includes the static mock JSON in public/mock).
FROM node:22-alpine AS build
ARG VITE_API_URL
WORKDIR /app
COPY package.json package-lock.json ./
ENV VITE_API_URL=$VITE_API_URL
RUN npm ci
COPY . .
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production
RUN npm run build

# Stage 2: serve the built assets with nginx.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
