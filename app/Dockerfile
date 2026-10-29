# syntax=docker/dockerfile:1
# Imagem reproduzível: deps resolvidas no build; runtime sem rede.
ARG DENO_IMAGE=denoland/deno:2.9.7

FROM ${DENO_IMAGE} AS build
WORKDIR /app
ENV DENO_DIR=/deno-dir \
    DENO_NO_UPDATE_CHECK=1

COPY deno.json deno.lock ./
COPY src ./src
COPY scripts ./scripts
COPY frontend ./frontend
COPY static ./static

# Cache de runtime + módulos descobertos em runtime.
RUN deno install --entrypoint src/main.ts \
 && deno cache src/main.ts src/modules/*/module.ts src/services/*/service.ts

# Excalidraw bundlado no build; o runtime só serve estático.
RUN deno task whiteboard:build

FROM ${DENO_IMAGE}
WORKDIR /app
ENV DENO_DIR=/deno-dir \
    DENO_NO_UPDATE_CHECK=1 \
    HOST=0.0.0.0 \
    PORT=50300

COPY --from=build /deno-dir /deno-dir
COPY --from=build /app /app
COPY docker/entrypoint.sh /usr/local/bin/meraki-entrypoint
RUN chmod 0755 /usr/local/bin/meraki-entrypoint \
 && mkdir -p /app/data \
 && chown -R 1000:1000 /app /deno-dir

# O compose usa o UID/GID do host; sem compose, 1000:1000.
USER 1000:1000
EXPOSE 50300

ENTRYPOINT ["meraki-entrypoint"]
CMD ["serve"]
