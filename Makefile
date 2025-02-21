RED := \033[0;31m
RESET := \033[0m

FAKE_FILE := .install
FAKE_CONTENT := "This is a fake file generated by 'make install'"

NODE_MODULES := frontend/node_modules
PACKAGE_JSON := frontend/package.json
NODE_MODULES_NEWER := $(shell [ ! -e $(NODE_MODULES) ] || [ $(NODE_MODULES) -ot $(PACKAGE_JSON) ]; echo $$?)
E2E_VENV := e2e/venv
E2E_INSTALL := e2e/install.sh
E2E_REQUIREMENTS := e2e/requirements.txt
E2E_INSTALL_NEWER := $(shell [ ! -e "$(E2E_VENV)" ] || [ "$(E2E_VENV)" -ot "$(E2E_INSTALL)" ] || [ "$(E2E_VENV)" -ot "$(E2E_REQUIREMENTS)" ]; echo $$?)

# Extract host from DATABASE_URL
HOST := $(shell echo $(DATABASE_URL) | sed -n 's/.*@\(.*\)\/.*/\1/p')


.PHONY: all
all: build doc


.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {gsub("\\\\n",sprintf("\n%22c",""), $$2);printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)


# Runs (Implicit builds)


.PHONY: run-frontend
run-frontend: build-frontend ## Build & Run frontend
	@cd frontend && npm run dev -- --host

.PHONY: run-backend
run-backend: build-backend ## Build & Run backend
	@cd backend && make run

.PHONY: run-reset-backend
run-reset-backend: reset-database ## Build & Run backend with a database reset
	$(MAKE) run-backend

.PHONY: run-mdbook
run-mdbook: doc-mdbook ## Build & Run mdbook
	@mdbook serve --open

.PHONY: run-storybook
run-storybook: doc-storybook ## Build & Run storybook
	@cd frontend && npm run storybook


# BUILD


.PHONY: build
build: build-frontend build-backend # Build everything

.PHONY: build-frontend
build-frontend: install-types install-frontend ## Build Frontend
	@cd frontend && npm run build

.PHONY: build-backend
build-backend: install-types install-backend ## Build Backend
	@make build -C ./backend


# DOCUMENTATION


.PHONY: doc
doc: doc-mdbook doc-backend doc-frontend doc-storybook ## Create all docs

.PHONY: doc-mdbook
doc-mdbook: install-mdbook ## Mdbook doc
	@mdbook build

.PHONY: doc-storybook
doc-storybook: install-frontend ## Storybook doc
	@cd frontend && npm run build-storybook

.PHONY: doc-backend
doc-backend: install-backend ## Backend src doc
	@echo "Not implemented yet."

.PHONY: doc-frontend
doc-frontend: install-frontend ## Frontend src doc
	@cd frontend && npm run doc


# Install


.PHONY: install
install: install-pre-commit install-backend install-mdbook install-frontend install-e2e install-types  ## Install ALL dependencies within the source repo
	@echo "Installation completed."

.PHONY: install-types
install-types: ## Run migrations and generate types for frontend
	@make migration -C ./backend
	@cd frontend && npm run generate-api-types

.PHONY: install-pre-commit
install-pre-commit: ## Install pre-commit
	@if [ ! -f $$(which pre-commit) ]; then \
		echo "pre-commit is not installed. Installing..."; \
		pip install pre-commit; \
	else \
        pre-commit install; \
		echo "Installation is up to date"; \
	fi

.PHONY: install-frontend
install-frontend: ## Install frontend
	@echo "Checking if npm install is required..."
	@if [ $(NODE_MODULES_NEWER) -eq 0 ]; then \
		echo "Running 'npm install'..."; \
		npm install --prefix frontend; \
	else \
		echo "Installation is up to date"; \
	fi

.PHONY: install-backend
install-backend: $(FAKE_FILE) ## Install backend deps
	@echo "Checking if backend is installed..."
	echo "Installation is up to date"; \

$(FAKE_FILE):  Makefile
	@echo $(FAKE_CONTENT) > $(FAKE_FILE)
	cd backend && make install

.PHONY: install-backend
install-mdbook: ## Install mdbook deps
	@echo "Checking if mdbook + deps is installed..."
	@if [ ! -f "/usr/local/cargo/bin/mdbook" ]; then \
		echo "Installing mdbook"; \
		cargo install mdbook mdbook-mermaid mdbook-linkcheck --locked; \
		cargo install --git https://github.com/ElektraInitiative/mdbook-generate-summary mdbook-generate-summary --locked; \
	else \
		echo "Installation is up to date"; \
	fi

.PHONY: install-e2e
install-e2e: ## Install e2e python dependencies within this repo
	@echo "Checking if e2e is installed..."
	@if [ $(E2E_INSTALL_NEWER) -eq 0 ]; then \
        read -p "This will install python packages. Do you want to install them now? (y/n): " choice; \
		if [ $$choice = "y" ]; then \
            echo "Running 'e2e install'..."; \
            rm -rf e2e/venv; \
            cd e2e && ./install.sh; \
        else \
			echo "Installation skipped."; \
		fi; \
	else \
		echo "Installation is up to date"; \
	fi


# Uninstall


.PHONY: uninstall
uninstall: uninstall-e2e uninstall-pre-commit uninstall-frontend uninstall-backend uninstall-mdbook uninstall-scraper ## Uninstall and clean everything up
	-rm -rf frontend/storybook-static

.PHONY: uninstall-pre-commit
uninstall-pre-commit:
	pre-commit uninstall -t pre-commit -t pre-merge-commit -t pre-push -t prepare-commit-msg -t commit-msg -t post-commit -t post-checkout -t post-merge -t post-rewrite
	pip uninstall pre-commit -y

.PHONY: uninstall-frontend
uninstall-frontend:
	-rm -rf frontend/node_modules

.PHONY: uninstall-backend
uninstall-backend:
	cd backend && make uninstall

.PHONY: uninstall-mdbook
uninstall-mdbook:
	-cargo uninstall mdbook mdbook-mermaid mdbook-linkcheck mdbook-generate-summary

.PHONY: uninstall-e2e
uninstall-e2e:
	-cd e2e && ./uninstall.sh

.PHONY: uninstall-scraper
uninstall-scraper:
	-rm -rf scraper/node_modules


# TEST (Implicit builds)


.PHONY: test
test: test-frontend test-backend test-mdbook test-e2e ## Test everything
	$(MAKE) pre-commit

.PHONY: test-e2e
test-e2e: ## End-to-End tests. Needs install-e2e, backend and frontend running
	@cd e2e && ./e2e.sh

.PHONY: test-frontend
test-frontend: ## Test Frontend
	@cd frontend && npm install && npm run format:check && npm run lint && npm run test

.PHONY: test-backend
test-backend: ## Test Backend
	@make test -C ./backend

.PHONY: test-mdbook
test-mdbook: ## Test Mdbook
	@mdbook test

# Test most makefile targets.
test-makefile: $(MAKEFILE_LIST)
	$(MAKE) doc
	$(MAKE) build
	$(MAKE) test
	$(MAKE) insert-scraper
	@echo "$(RED)Targets passed the test$(RESET)"


# MISC


.PHONY: insert-scraper
insert-scraper: ## Insert scraped data into the database
	@cd scraper && npm install && mkdir -p data && npm run insert

.PHONY: migration
migration: ## Database migration.
	@make migration -C ./backend

.PHONY: migration-redo
migration-redo: ## Run down.sql and then up.sql for most recent migrations
	@make migration-redo -C ./backend

.PHONY: migration-redo-a
migration-redo-a: ## Run down.sql and then up.sql for all migrations
	@make migration-redo-a -C ./backend

.PHONY: reset-database
reset-database: ## Reset diesel database AND insert data again
	@make reset-database -C ./backend
	$(MAKE) insert-scraper

.PHONY: psql-r
psql-r: ## Remote connect to postgis, uses $POSTGRES_USER and $POSTGRES_DB
	@psql -h $(HOST) -p 5432 -U $(POSTGRES_USER) $(POSTGRES_DB)

.PHONY: pre-commit
pre-commit: ## Check all files with pre-commit
	@pre-commit run --all-files

.PHONY: docker-up
docker-up: ## Start a containerized dev environment
	@docker compose -p "permaplant_devcontainer" -f .devcontainer/docker-compose.yml up
