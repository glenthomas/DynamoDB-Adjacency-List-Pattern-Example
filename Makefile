.PHONY: help install build deploy load-data clean-table run clean

help:
	@echo "DynamoDB Adjacency List Pattern Demo"
	@echo "===================================="
	@echo "Available commands:"
	@echo "  make install     - Install npm dependencies"
	@echo "  make deploy      - Deploy DynamoDB table"
	@echo "  make build       - Build TypeScript code"
	@echo "  make load-data   - Load sample data"
	@echo "  make run         - Run the demo"
	@echo "  make clean-table - Clean all data from table"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make all         - Complete setup and run"

install:
	npm install

deploy:
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh

build:
	npm run build

load-data: build
	npm run load-data

run: build
	npm start

clean-table: build
	npm run clean-table

clean:
	rm -rf dist/
	rm -rf node_modules/

all: install deploy build load-data run
