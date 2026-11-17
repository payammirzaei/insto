# Optional Docker path for Railway (Railpack is default via railway.toml).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && node scripts/package.mjs

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
# Zero runtime npm deps — serve.mjs uses Node built-ins only.
COPY package.json ./
COPY --from=build /app/release ./release
COPY --from=build /app/site ./site
COPY --from=build /app/scripts/serve.mjs ./scripts/serve.mjs
EXPOSE 8080
CMD ["node", "scripts/serve.mjs"]
