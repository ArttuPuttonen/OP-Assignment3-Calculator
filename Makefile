.PHONY: help install build deploy destroy test-local clean

help:
	@echo "Available commands:"
	@echo "  make install      - Install all dependencies"
	@echo "  make build        - Build Docker image locally"
	@echo "  make deploy       - Deploy to AWS"
	@echo "  make destroy      - Destroy AWS infrastructure"
	@echo "  make test-local   - Test Docker container locally"
	@echo "  make clean        - Clean build artifacts"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing infrastructure dependencies..."
	cd infrastructure && npm install
	@echo "✓ Dependencies installed"

build:
	@echo "Building Docker image..."
	cd backend && docker build -t lambda-calculator:latest .
	@echo "✓ Docker image built"

deploy:
	@echo "Deploying to AWS..."
	cd infrastructure && npx cdk deploy --require-approval never
	@echo "✓ Deployment complete"

destroy:
	@echo "Destroying AWS infrastructure..."
	cd infrastructure && npx cdk destroy --force
	@echo "✓ Infrastructure destroyed"

test-local:
	@echo "Starting Docker container on port 9000..."
	@docker run -d -p 9000:8080 --name calculator-test lambda-calculator:latest
	@sleep 3
	@echo "Testing calculator endpoint..."
	@curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
		-H "Content-Type: application/json" \
		-d '{"body":"{\"principal\":1000,\"rate\":5,\"years\":10,\"frequency\":4}"}' \
		| python3 -m json.tool
	@docker stop calculator-test && docker rm calculator-test
	@echo "✓ Local test complete"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/node_modules
	rm -rf infrastructure/node_modules
	rm -rf infrastructure/cdk.out
	find . -name "*.js" -not -path "*/node_modules/*" -delete
	find . -name "*.d.ts" -not -path "*/node_modules/*" -delete
	@echo "✓ Clean complete"
