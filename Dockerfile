FROM ghcr.io/codbex/codbex-gaia:0.26.0

COPY pi-bank-backend target/dirigible/repository/root/registry/public/pi-bank-backend

ENV DIRIGIBLE_HOME_URL=/services/web/pi-bank-backend/gen/bank-backend/index.html

ENV DIRIGIBLE_MULTI_TENANT_MODE=false

EXPOSE 80
