#!/usr/bin/env bash

set -e

########################################
# move to repo root
########################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

APP_NAME="wraply-user"

echo ""
echo "🚀 Wraply User Setup Starting"
echo ""

########################################
# check existing
########################################

if [ -d "$APP_NAME" ]; then
  echo "❌ $APP_NAME already exists"
  exit 1
fi

########################################
# create vite project
########################################

echo "📦 Creating Vite React + TS project"

pnpm create vite "$APP_NAME" --template react-ts

########################################
# enter project
########################################

cd "$APP_NAME"

########################################
# install deps
########################################

echo "📦 Installing dependencies"

pnpm install

########################################
# install libraries
########################################

echo "📦 Installing libraries"

pnpm add react-router-dom axios zustand clsx lucide-react

pnpm add react-hook-form zod

########################################
# tailwind v4
########################################

echo "🎨 Installing Tailwind v4"

pnpm add -D tailwindcss @tailwindcss/vite

########################################
# update vite config
########################################

echo "⚙️ Configuring Vite"

cat <<EOF > vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({

  plugins: [
    react(),
    tailwindcss()
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }

})
EOF

########################################
# tsconfig alias
########################################

echo "⚙️ Configuring TypeScript alias"

node <<'EOF'
const fs = require("fs")

const path = "./tsconfig.json"

const tsconfig = JSON.parse(fs.readFileSync(path))

tsconfig.compilerOptions = tsconfig.compilerOptions || {}
tsconfig.compilerOptions.baseUrl = "."
tsconfig.compilerOptions.paths = {
  "@/*": ["src/*"]
}

fs.writeFileSync(path, JSON.stringify(tsconfig, null, 2))
EOF

########################################
# styles
########################################

echo "🎨 Creating Tailwind styles"

mkdir -p src/styles

cat <<EOF > src/styles/globals.css
@import "tailwindcss";
EOF

########################################
# update main.tsx
########################################

cat <<EOF > src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF

########################################
# shadcn
########################################

echo "🎨 Installing shadcn/ui"

pnpm dlx shadcn@latest init -d

########################################
# directories
########################################

echo "📁 Creating project structure"

mkdir -p src/app
mkdir -p src/components/layout
mkdir -p src/components/build
mkdir -p src/components/apps
mkdir -p src/components/ui

mkdir -p src/pages/dashboard
mkdir -p src/pages/apps
mkdir -p src/pages/builds
mkdir -p src/pages/certificates
mkdir -p src/pages/account

mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/types
mkdir -p src/utils

########################################
# base files
########################################

echo "📄 Creating base files"

touch src/app/router.tsx

touch src/components/layout/Sidebar.tsx
touch src/components/layout/Header.tsx

touch src/components/build/BuildTimeline.tsx
touch src/components/build/BuildLogViewer.tsx
touch src/components/build/BuildStatusBadge.tsx
touch src/components/build/BuildTrigger.tsx

touch src/components/apps/AppCard.tsx
touch src/components/apps/AppForm.tsx

touch src/pages/dashboard/DashboardPage.tsx

touch src/pages/apps/AppsPage.tsx
touch src/pages/apps/AppCreatePage.tsx
touch src/pages/apps/AppDetailPage.tsx

touch src/pages/builds/BuildCenterPage.tsx
touch src/pages/builds/BuildDetailPage.tsx

touch src/pages/certificates/CertificatesPage.tsx
touch src/pages/account/AccountPage.tsx

touch src/services/api.ts
touch src/services/apps.ts
touch src/services/builds.ts
touch src/services/certificates.ts
touch src/services/websocket.ts

touch src/hooks/useAuth.ts
touch src/hooks/useWebSocket.ts

touch src/store/authStore.ts

touch src/types/app.ts
touch src/types/build.ts
touch src/types/user.ts

touch src/utils/formatDate.ts
touch src/utils/buildStatus.ts

########################################
# done
########################################

echo ""
echo "✅ Wraply User Setup Complete"
echo ""
echo "Run:"
echo ""
echo "cd wraply-user"
echo "pnpm dev"
echo ""