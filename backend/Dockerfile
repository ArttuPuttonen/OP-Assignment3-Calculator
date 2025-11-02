# ============================================
# STAGE 1: Builder - Compile TypeScript
# ============================================
FROM public.ecr.aws/lambda/nodejs:20 AS builder

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy TypeScript source and config
COPY handler.ts tsconfig.json ./

# Install TypeScript and compile
RUN npm install -g typescript && \
    tsc

# ============================================
# STAGE 2: Runtime - Optimized final image
# ============================================
FROM public.ecr.aws/lambda/nodejs:20

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy ONLY the compiled JavaScript from builder stage
COPY --from=builder /var/task/handler.js ./

# Set the CMD to your handler
CMD [ "handler.handler" ]
