#!/bin/bash
set -e  # Exit on first error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Quality Control Checks...${NC}\n"

# ==========================================
# BACKEND CHECKS
# ==========================================
echo -e "${YELLOW}🐍 Running Backend Checks (Python)...${NC}"
cd src/backend

# 1. Format with Black
if command -v black &> /dev/null; then
    echo "Running Black..."
    black .
else
    echo -e "${RED}❌ Black not found. Skipping.${NC}"
fi

# 2. Lint with Ruff
if command -v ruff &> /dev/null; then
    echo "Running Ruff..."
    ruff check . --fix
else
    echo -e "${RED}❌ Ruff not found. Skipping.${NC}"
fi

# Go back to root
cd ../..

echo -e "${GREEN}✅ Backend checks complete.${NC}\n"


# ==========================================
# FRONTEND CHECKS
# ==========================================
echo -e "${YELLOW}⚛️  Running Frontend Checks (TypeScript/React)...${NC}"
cd src/frontend

# 1. ESLint
echo "Running ESLint..."
npm run lint

# 2. TypeScript Check
echo "Running TypeScript Check (tsc)..."
if npx tsc --noEmit; then
    echo -e "${GREEN}TypeScript check passed.${NC}"
else
    echo -e "${RED}❌ TypeScript check failed!${NC}"
    exit 1
fi

# Go back to root
cd ../..

echo -e "${GREEN}✅ Frontend checks complete.${NC}\n"

# ==========================================
# SUMMARY
# ==========================================
echo -e "${GREEN}🎉 All checks passed! You are ready to commit.${NC}"
