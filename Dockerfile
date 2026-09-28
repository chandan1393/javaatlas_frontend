# ---- Build the Angular site (every page prerendered to static HTML) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=""
ENV SITE_URL=${SITE_URL}
RUN npm run build

# ---- Serve it with Caddy (HTTPS, and /api/* forwarded to the backend) ----
FROM caddy:2
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/javaatlas-web/browser /srv
