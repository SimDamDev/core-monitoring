# Liste des commandes
.PHONY: help test test-watch install clean start

# Commande par défaut
.DEFAULT_GOAL := help

# Commandes principales
start:
	node index.mjs

test:
	npm test

test-watch:
	npm test -- --watch

install:
	npm install

clean:
	if exist node_modules rd /s /q node_modules
	if exist package-lock.json del /f package-lock.json

# Aide et documentation
help:
ifeq ($(filter config,$(MAKECMDGOALS)),config)
	@echo === IronMetrics ===
	@echo.
	@echo Configuration des raccourcis clavier :
	@echo   1. Ouvrir la palette de commandes avec Ctrl+Shift+P
	@echo   2. Taper 'Keyboard JSON'
	@echo   3. Copier cette configuration :
	@echo.
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
	@echo     }
	@echo ]
else
	@echo === IronMetrics ===
	@echo.
	@echo Commandes :
	@echo   make help         : Affiche cette aide
	@echo   make help config  : Affiche la configuration des raccourcis
	@echo   make test        : Lance les tests une fois
	@echo   make test-watch  : Lance les tests en mode watch
	@echo   make install     : Installe les dependances
	@echo   make clean       : Nettoie le projet
	@echo   make start       : Lance l'application
endif
