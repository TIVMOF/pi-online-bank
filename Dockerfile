FROM ghcr.io/codbex/codbex-gaia:0.26.0

COPY pi-bank-backend target/dirigible/repository/root/registry/public/pi-bank-backend
COPY pi-bank-backend/node_modules/@codbex target/dirigible/repository/root/registry/public/

ENV DIRIGIBLE_HOME_URL=/services/web/pi-bank-backend/gen/pi-bank-backend/index.html

ENV DIRIGIBLE_MULTI_TENANT_MODE=false
ENV DIRIGIBLE_KEYCLOAK_ENABLED=true

EXPOSE 80
