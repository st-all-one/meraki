# Meraki — operação Docker (dev e produção)
SHELL := /bin/sh
COMPOSE ?= docker compose
PROD_COMPOSE := $(COMPOSE) -f compose.yaml -f compose.prod.yaml
APP_DIR := app
NAME ?= Admin
MODE ?= dev

# Bind mount precisa pertencer ao usuário do host.
export UID := $(shell id -u)
export GID := $(shell id -g)

.PHONY: help env dev prod down restart logs ps shell migrate seed admin backup doctor restore reset build check test e2e

help: ## Lista os alvos
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-12s %s\n", $$1, $$2}'

env: ## Cria .env/.env.example e data/ com permissões restritas
	@test -f .env || (cp .env.example .env && chmod 600 .env && echo "criado .env a partir de .env.example")
	@dir=$$(sed -n 's/^HOST_DATA_PATH=//p' .env | tail -n1); dir=$${dir:-./data}; \
		mkdir -p "$$dir" && chmod 700 "$$dir" && echo "dados: $$dir"

dev: env ## Sobe app + Caddy em desenvolvimento (seed automático)
	$(COMPOSE) up -d --build --wait
	@echo "Meraki dev: $$(sed -n 's/^DEV_APP_URL=//p' .env | tail -n1)"

prod: env ## Sobe app + Caddy em produção atrás do LB/TLS
	$(PROD_COMPOSE) up -d --build --wait
	@echo "Meraki prod: $$(sed -n 's/^PROD_APP_URL=//p' .env | tail -n1)"

down: ## Derruba containers (preserva data/)
	$(COMPOSE) down --remove-orphans

restart: ## Reinicia app e Caddy
	$(COMPOSE) restart app caddy

logs: ## Logs de app + Caddy
	$(COMPOSE) logs -f app caddy

ps: ## Estado dos containers
	$(COMPOSE) ps

shell: ## Shell no container da app
	$(COMPOSE) exec app sh

migrate: env ## Migra o banco no volume Docker
	$(COMPOSE) run --rm --no-deps app migrate

seed: env ## Aplica seed de demonstração
	$(COMPOSE) run --rm --no-deps app seed

admin: env ## Cria admin: make admin EMAIL=... [NAME=...]
	@test -n "$(EMAIL)" || (echo "uso: make admin EMAIL=admin@empresa [NAME=Admin]"; exit 2)
	$(COMPOSE) run --rm --no-deps app create-admin --email "$(EMAIL)" --name "$(NAME)"

backup: env ## Backup online do SQLite + anexos no volume
	$(COMPOSE) run --rm --no-deps app backup

doctor: env ## Integridade do SQLite no volume
	$(COMPOSE) run --rm --no-deps app doctor

restore: env ## Restaura backup: make restore BACKUP=meraki-... [MODE=prod]
	@test -n "$(BACKUP)" || (echo "uso: make restore BACKUP=meraki-YYYY... [MODE=prod]"; exit 2)
	$(COMPOSE) stop app
	$(COMPOSE) run --rm --no-deps app restore "/app/data/backups/$(BACKUP)" --force
	@if [ "$(MODE)" = "prod" ]; then $(PROD_COMPOSE) up -d --wait app; else $(COMPOSE) up -d --wait app; fi
	@echo "restore concluído: $(BACKUP) (modo $(MODE))"

reset: env ## DESTRUTIVO: apaga o SQLite e recria schema
	$(COMPOSE) stop app
	$(COMPOSE) run --rm --no-deps app db:reset
	$(COMPOSE) up -d --wait app

build: ## Constrói a imagem da app
	$(COMPOSE) build app

check: ## fmt + lint + types + gates (host com Deno)
	cd $(APP_DIR) && deno task check

test: ## Testes unitários (host com Deno)
	cd $(APP_DIR) && deno task test

e2e: ## Playwright (host; app precisa estar rodando)
	cd $(APP_DIR)/e2e && npm test
