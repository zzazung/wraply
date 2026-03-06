#!/bin/bash

set -e

ROOT="wraply"

echo "📦 Creating Wraply monorepo..."

mkdir -p $ROOT
cd $ROOT

#################################################
# wraply-user (Next.js)
#################################################

echo "🚀 Creating wraply-user (Next.js)"

npx create-next-app@latest wraply-user \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir=false \
  --import-alias="@/*" \
  --no-turbo

cd wraply-user

mkdir -p components/layout
mkdir -p components/projects
mkdir -p components/builds
mkdir -p components/splash
mkdir -p components/jobs
mkdir -p components/ui

mkdir -p hooks
mkdir -p lib
mkdir -p types

cd ..

#################################################
# wraply-admin
#################################################

echo "🚀 Creating wraply-admin (Next.js)"

npx create-next-app@latest wraply-admin \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir=false \
  --import-alias="@/*" \
  --no-turbo

cd wraply-admin

mkdir -p components
mkdir -p hooks
mkdir -p lib

cd ..

#################################################
# wraply-api
#################################################

echo "🚀 Creating wraply-api"

mkdir -p wraply-api
cd wraply-api

npm init -y

# npm install express cors ws zod jsonwebtoken dotenv mariadb

mkdir -p routes
mkdir -p services
mkdir -p websocket
mkdir -p db
mkdir -p middleware

touch server.js

cd ..

#################################################
# wraply-worker
#################################################

echo "🚀 Creating wraply-worker"

mkdir -p wraply-worker
cd wraply-worker

npm init -y

# npm install ws dotenv

mkdir -p workers
mkdir -p scripts
mkdir -p services

touch worker.js

cd ..

#################################################
# wraply-shared
#################################################

echo "🚀 Creating wraply-shared"

mkdir -p wraply-shared
cd wraply-shared

npm init -y

# npm install dotenv mariadb

mkdir -p db
mkdir -p stroage
mkdir -p job

touch config.js

cd ..

#################################################
# shared scripts
#################################################

mkdir -p scripts

#################################################
# docker
#################################################

mkdir -p docker

touch docker/docker-compose.yml

#################################################
# git
#################################################

git init

echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore

#################################################
# module install
#################################################

pnpm add express cors ws zod dotenv mysql2 ioredis bullmq ws jsonwebtoken bcryptjs -w

echo "✅ Wraply structure created!"
echo ""
echo "Next steps:"
echo "cd wraply"
echo "code ."