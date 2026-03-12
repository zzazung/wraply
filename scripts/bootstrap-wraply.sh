#!/usr/bin/env bash

set -e

########################################
# move to repo root
########################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "🚀 Wraply Bootstrap Starting"

########################################
# pnpm workspace
########################################

echo "📦 Creating pnpm workspace"

cat <<EOF > pnpm-workspace.yaml
packages:
  - wraply-api
  - wraply-worker
  - wraply-scheduler
  - wraply-shared
  - wraply-admin
  - wraply-user
EOF

########################################
# root package.json
########################################

echo "📦 Creating root package.json"

cat <<EOF > package.json
{
  "name": "wraply",
  "private": true,

  "scripts": {

    "dev": "pnpm -r dev",

    "dev:api": "pnpm --filter wraply-api dev",
    "dev:worker": "pnpm --filter wraply-worker dev",
    "dev:scheduler": "pnpm --filter wraply-scheduler dev",

    "dev:admin": "pnpm --filter wraply-admin dev",
    "dev:user": "pnpm --filter wraply-user dev",

    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write"
  }
}
EOF

########################################
# eslint / prettier
########################################

echo "📦 Installing ESLint + Prettier"

pnpm add -Dw \
eslint \
@eslint/js \
typescript-eslint \
eslint-plugin-import \
eslint-plugin-unused-imports \
eslint-config-prettier \
eslint-plugin-prettier \
prettier

########################################
# prettier config
########################################

cat <<EOF > .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "none",
  "printWidth": 80,
  "tabWidth": 2
}
EOF

########################################
# eslint config
########################################

cat <<EOF > eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [

  js.configs.recommended,
  ...tseslint.configs.recommended

];
EOF

########################################
# create admin
########################################

if [ ! -d "wraply-admin" ]; then

  echo "📦 Creating wraply-admin"

  ./scripts/create-wraply-admin.sh

fi

########################################
# create user
########################################

if [ ! -d "wraply-user" ]; then

  echo "📦 Creating wraply-user"

  ./scripts/create-wraply-user.sh

fi

########################################
# install workspace
########################################

echo "📦 Installing packages"

pnpm install

########################################
# env templates
########################################

echo "📄 Creating env templates"

touch wraply-api/.env
touch wraply-worker/.env
touch wraply-scheduler/.env

########################################
# done
########################################

echo ""
echo "✅ Wraply Bootstrap Complete"
echo ""
echo "Run development:"
echo ""
echo "pnpm dev"
echo ""
echo "Or run individually:"
echo ""
echo "pnpm dev:api"
echo "pnpm dev:worker"
echo "pnpm dev:scheduler"
echo "pnpm dev:admin"
echo "pnpm dev:user"