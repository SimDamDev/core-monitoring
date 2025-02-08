# Variables configurables
MODS_DIR = ./mods
TESTS_DIR = ./tests
NODE_OPTS = --experimental-modules --no-warnings
NPM_RUN = npm exec --
DOCKER_IMAGE = ironmetrics
DOCKER_PORT = 3000

# Configuration du navigateur pour les rapports de couverture
define BROWSER
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }; \
await sleep(1000); window.close();
endef

export BROWSER

# Liste des commandes
.PHONY: help test test-watch install clean start audit test-coverage docker-build docker-run docker-stop docker-compose-up docker-compose-down

# Commande par défaut
.DEFAULT_GOAL := help

# Commandes principales
start:
	node $(NODE_OPTS) index.mjs

# Ajout de la commande dev pour le développement
dev:
	nodemon $(NODE_OPTS) index.mjs

test:
	node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --no-cache

test-watch:
	node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --watch --no-cache

test-coverage:
	node --experimental-vm-modules --no-warnings node_modules/jest/bin/jest.js --coverage --no-cache

install:
	npm install

clean:
	$(NPM_RUN) rimraf node_modules package-lock.json coverage .temp

audit:
	$(NPM_RUN) npm audit

docker-build:
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	docker run -p $(DOCKER_PORT):$(DOCKER_PORT) $(DOCKER_IMAGE)

# Nouvelle commande pour arrêter le conteneur Docker
docker-stop:
	docker stop $$(docker ps -q --filter ancestor=$(DOCKER_IMAGE))

# Nouvelle commande pour le développement avec Docker Compose
docker-compose-up:
	docker-compose up -d

docker-compose-down:
	docker-compose down

# Aide et documentation
help:
ifeq ($(filter config,$(MAKECMDGOALS)),config)
	@echo === IronMetrics ===
	@echo
	@echo Configuration des raccourcis clavier :
	@echo   1. Ouvrir la palette de commandes avec Ctrl+Shift+P
	@echo   2. Taper 'Keyboard JSON'
	@echo   3. Copier cette configuration :
	@echo
	@echo [
	@echo     {
	@echo         "key": "ctrl+shift+t",
	@echo         "command": "workbench.action.terminal.sendSequence",
	@echo         "args": { "text": "make test\n" },
	@echo         "when": "terminalFocus"
	@echo     },
	@echo     {
	@echo         "key": "ctrl+alt+t",
	@echo         "command": "workbench.action.terminal.sendSequence",
	@echo         "args": { "text": "make test-watch\n" },
	@echo         "when": "terminalFocus"
	@echo     },
	@echo     {
	@echo         "key": "ctrl+shift+r",
	@echo         "command": "workbench.action.terminal.sendSequence",
	@echo         "args": { "text": "make start\n" },
	@echo         "when": "terminalFocus"
	@echo     },
	@echo     {
	@echo         "key": "ctrl+shift+c",
	@echo         "command": "workbench.action.terminal.sendSequence",
	@echo         "args": { "text": "make test-coverage\n" },
	@echo         "when": "terminalFocus"
	@echo     },
	@echo     {
	@echo         "key": "ctrl+shift+x",
	@echo         "command": "workbench.action.terminal.sendSequence",
	@echo         "args": { "text": "make clean\n" },
	@echo         "when": "terminalFocus"
	@echo     },
	@echo     {
	@echo         "key": "ctrl+shift+a",
	@echo         "command": "workbench.action.terminal.sendSequence",
	@echo         "args": { "text": "make audit\n" },
	@echo         "when": "terminalFocus"
	@echo     }
	@echo ]
else
	@echo === IronMetrics ===
	@echo
	@echo Commandes disponibles :
	@echo   make help          - Affiche cette aide 
	@echo   make help config   - Affiche la configuration des raccourcis
	@echo   make test         - Lance les tests une fois (Ctrl+Shift+T)
	@echo   make test-watch   - Lance les tests en mode watch (Ctrl+Alt+T)
	@echo   make test-coverage - Génère le rapport de couverture (Ctrl+Shift+C)
	@echo   make install      - Installe les dépendances
	@echo   make clean        - Nettoie le projet (Ctrl+Shift+X)
	@echo   make start        - Lance l'application (Ctrl+Shift+R)
	@echo   make dev          - Lance l'application en mode développement
	@echo   make audit        - Vérifie les vulnérabilités (Ctrl+Shift+A)
	@echo   make docker-build - Construit l'image Docker
	@echo   make docker-run   - Lance le conteneur Docker
	@echo   make docker-stop  - Arrête le conteneur Docker
	@echo   make docker-compose-up   - Lance les services avec Docker Compose
	@echo   make docker-compose-down - Arrête les services Docker Compose
endif
