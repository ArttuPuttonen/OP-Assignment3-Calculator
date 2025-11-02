# Simple Compound Interest Calculator

**Assignment 3**: Infrastructure as Code Web Application  
**Candidate**: Arttu Puttonen  
**Live Demo**: http://simplecalculatorstack-websitebucket75c24d94-mvxqtxndlkhz.s3-website.eu-north-1.amazonaws.com

---

## Overview

A serverless web application with **separate front and back ends** deployed on AWS using Infrastructure as Code (AWS CDK).

- **Frontend**: Static HTML/JavaScript hosted on S3
- **Backend**: Multi-stage Dockerized TypeScript Lambda function (Node.js 20.x)
- **API**: REST API Gateway with CORS
- **IaC**: AWS CDK with TypeScript
- **Region**: eu-north-1 (Stockholm)
- **Containerization**: ✅ Docker with multi-stage build (AWS Lambda Container Image)

**Project Structure**:
```
├── backend/           # Multi-stage Dockerized Lambda function (separate backend)
│   ├── handler.ts     # Lambda function code
│   ├── Dockerfile     # Multi-stage container definition
│   └── package.json   # Dependencies
├── frontend/          # HTML/JS web interface (separate frontend)
└── infrastructure/    # AWS CDK infrastructure code
```

---

## Prerequisites

### 1. Install Required Tools

**Node.js 18+**  
Download from https://nodejs.org/

**AWS CLI**  
```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

**AWS CDK CLI**  
```bash
npm install -g aws-cdk
```

### 2. Configure AWS Authentication

You need an AWS account with permissions for: S3, Lambda, API Gateway, IAM, and CloudFormation.

```bash
# Configure AWS credentials
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `eu-north-1`
- Output format: `json`

**Verify authentication**:
```bash
aws sts get-caller-identity
```

---

## Deployment Instructions

### Quick Start (Using Makefile)

```bash
# Install all dependencies
make install

# Deploy to AWS (builds and pushes Docker image automatically)
make deploy

# Test Docker container locally
make test-local

# Clean up AWS resources
make destroy
```

### Manual Deployment (Without Makefile)

<details>
<summary>Click to expand manual steps</summary>

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install infrastructure dependencies
cd ../infrastructure
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
# From infrastructure directory
npx cdk bootstrap
```

This creates the CDK toolkit stack in your AWS account (one-time setup).

### 3. Deploy the Application

```bash
# From infrastructure directory
npx cdk deploy
```

**What this does**:
- Builds Docker image for TypeScript backend
- Pushes image to Amazon ECR (Elastic Container Registry)
- Creates Lambda function from Docker image
- Creates API Gateway REST API
- Creates S3 bucket with website hosting
- Uploads frontend files to S3

</details>

**Deployment time**: ~2-3 minutes

**Note the outputs**: The command will output:
- `WebsiteURL` - Your application URL
- `ApiEndpoint` - The API endpoint (already configured in frontend)

### 4. Verify Deployment

Test the API directly:
```bash
curl -X POST https://z3c01c1921.execute-api.eu-north-1.amazonaws.com/prod/calculate \
  -H "Content-Type: application/json" \
  -d '{"principal":1000,"rate":5,"years":10,"frequency":4}'

# Expected response:
# {"result":1643.62,"principal":1000,"rate":5,"years":10,"frequency":4}
```

Open the `WebsiteURL` in your browser to use the calculator interface.

---

## Destroy Infrastructure

```bash
# Using Makefile
make destroy

# Or manually
cd infrastructure && npx cdk destroy
```

This will:
- Delete the Lambda function
- Delete the API Gateway
- Delete the S3 bucket and all contents
- Remove IAM roles

**Note**: The CDK bootstrap stack (`CDKToolkit`) remains for future deployments. To remove it:
```bash
aws cloudformation delete-stack --stack-name CDKToolkit --region eu-north-1
```

---

## Technical Details

### Application Functionality

The calculator computes compound interest using the formula: **A = P(1 + r/n)^(nt)**

- User enters principal, interest rate, years, and compounding frequency
- Frontend validates input and makes HTTP POST request to backend
- Backend calculates result and returns JSON response
- Frontend displays the final amount and interest earned

### Separate Front and Back Ends (Assignment Requirement)

As explicitly required by the assignment:
- **Backend**: Dockerized TypeScript Lambda function in `backend/` folder
- **Frontend**: HTML/JavaScript in `frontend/` folder
- **HTTP Communication**: Frontend makes POST request to `API_ENDPOINT/calculate` with JSON payload:
  ```javascript
  // In frontend/index.html (line 159)
  const response = await fetch(API_ENDPOINT + '/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principal, rate, years, frequency })
  });
  ```
- **Response**: Backend returns JSON with calculation result
- **Separation**: Frontend and backend are in completely separate folders and communicate only via HTTP

### Idempotency

The deployment is idempotent - running `cdk deploy` multiple times will:
- Update existing resources if code changed
- Keep existing resources unchanged if no changes
- Not duplicate resources

### Containerization

The backend uses Docker with a multi-stage build for optimal image size and security. Stage 1 compiles TypeScript with development dependencies, while Stage 2 contains only the compiled JavaScript and production dependencies. This eliminates the TypeScript compiler and source files from the final runtime image, reducing attack surface and image size. The container uses the official AWS Lambda Node.js 20 base image for environment consistency between local testing and AWS Lambda deployment.

---

## Known Limitations

1. **HTTP only** - S3 website hosting doesn't include HTTPS. Production would use CloudFront + ACM certificate.
2. **No authentication** - API is public. Production would add API keys or Cognito.
3. **No monitoring** - Production would add CloudWatch dashboards and alarms.
4. **Single region** - No global distribution. Production would use CloudFront for edge caching.
5. **No database** - Stateless calculations only. No history stored.

These are intentional trade-offs for assignment simplicity, not technical constraints.

---

## Architecture Diagram

```
User Browser
     ↓
S3 Static Website (Frontend)
     ↓ HTTP POST
API Gateway
     ↓ invoke
Lambda Function (Backend)
     ↓
Returns calculation result
```

