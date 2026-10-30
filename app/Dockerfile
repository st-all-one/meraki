# syntax=docker/dockerfile:1
ARG DENO_IMAGE=denoland/deno:2.9.7
ARG DISTROLESS_IMAGE=denoland/deno:distroless-2.9.7@sha256:16583ef81ce73d6fdf806174fbda68bf4c57e914659ffe6b1c2b600ac2327962

FROM ${DENO_IMAGE} AS build
WORKDIR /app
ENV DENO_DIR=/deno-dir \
    DENO_NO_UPDATE_CHECK=1

COPY deno.json deno.lock ./
COPY src ./src
COPY scripts ./scripts
COPY frontend ./frontend
COPY static ./static

RUN deno install --entrypoint src/main.ts \
 && deno cache src/main.ts src/modules/*/module.ts src/services/*/service.ts

RUN deno task whiteboard:build
RUN deno task build:bin

FROM ${DISTROLESS_IMAGE}
WORKDIR /app
ENV DENO_NO_UPDATE_CHECK=1 \
    HOST=0.0.0.0 \
    PORT=50300

COPY --from=build /app/dist/meraki /app/meraki


USER 1000:1000
EXPOSE 50300

ENTRYPOINT ["/tini", "--", "/app/meraki"]
CMD ["serve"]