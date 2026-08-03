# --- build della PWA ---
FROM node:22-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
COPY app/package.json app/
COPY server/package.json server/
RUN npm ci
COPY app app
RUN npm run build -w app

# --- runtime ---
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /srv/server
COPY package.json package-lock.json /srv/
COPY server/package.json ./
RUN cd /srv && npm ci -w server --omit=dev
COPY server/src src
COPY --from=build /build/app/dist /srv/public

ENV DATA_DIR=/data
ENV STATIC_DIR=/srv/public
ENV CERT_DIR=/certs
EXPOSE 3000 3443
VOLUME /data

CMD ["npx", "tsx", "src/index.ts"]
