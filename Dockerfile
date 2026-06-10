FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime

ARG VCS_REF BUILD_DATE
LABEL org.opencontainers.image.title="finalbackmaptdp" \
      org.opencontainers.image.description="API Node/Express production image (Sequelize + pg)" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="ISC"

# ⚠️ ENLEVER TOUTES LES VARIABLES EXCEPTÉ SI C'EST VITAL
# ENV NODE_ENV=production
# ENV PORT=8000 ...

WORKDIR /app

COPY --chown=nonroot:nonroot --from=builder /app/node_modules /app/node_modules
COPY --chown=nonroot:nonroot --from=builder /app/package*.json /app/
COPY --chown=nonroot:nonroot --from=builder /app/index.js /app/
COPY --chown=nonroot:nonroot --from=builder /app/app /app/app

EXPOSE 80
USER nonroot

CMD ["index.js"]