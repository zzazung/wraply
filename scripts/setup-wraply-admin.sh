#!/usr/bin/env bash

set -e

########################################
# move to repo root
########################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "🚀 Wraply Admin Setup Starting"

if [ -d "wraply-admin" ]; then
  echo "❌ wraply-admin already exists"
  exit 1
fi

########################################
# helpers
########################################

create_file() {

  FILE=$1

  mkdir -p "$(dirname "$FILE")"

  touch "$FILE"

  echo "created $FILE"
}

create_files() {

  for FILE in "$@"; do
    create_file "$FILE"
  done

}

########################################
# project create
########################################

echo "📦 Creating Next.js project"

npx create-next-app@latest wraply-admin \
--typescript \
--eslint \
--app \
--src-dir \
--import-alias "@/*" \
--yes

cd wraply-admin

########################################
# install dependencies
########################################

echo "📦 Installing libraries"

pnpm add \
axios \
zustand \
clsx \
lucide-react \
@tanstack/react-query \
@tanstack/react-table \
react-hook-form \
zod

########################################
# tailwind v4
########################################

echo "🎨 Installing Tailwind"

pnpm add tailwindcss @tailwindcss/postcss postcss

cat <<EOF > postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
}
EOF

mkdir -p src/styles

cat <<EOF > src/styles/globals.css
@import "tailwindcss";

html,
body {

  margin: 0;
  padding: 0;

}
EOF

########################################
# shadcn
########################################

echo "🎨 Installing shadcn"

pnpm dlx shadcn@latest init -y

########################################
# directories
########################################

echo "📁 Creating directory structure"

mkdir -p src/app
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/api
mkdir -p src/store
mkdir -p src/types
mkdir -p src/lib
mkdir -p src/providers
mkdir -p src/styles

########################################
# app pages
########################################

echo "📄 Creating app pages"

create_files \
src/app/layout.tsx \
src/app/page.tsx \
src/app/dashboard/page.tsx \
src/app/builds/page.tsx \
src/app/builds/history/page.tsx \
src/app/builds/[jobId]/page.tsx \
src/app/builds/[jobId]/logs/page.tsx \
src/app/builds/[jobId]/artifacts/page.tsx \
src/app/apps/page.tsx \
src/app/apps/new/page.tsx \
src/app/apps/[appId]/page.tsx \
src/app/apps/[appId]/builds/page.tsx \
src/app/apps/[appId]/settings/page.tsx \
src/app/artifacts/page.tsx \
src/app/artifacts/apk/page.tsx \
src/app/artifacts/ipa/page.tsx \
src/app/workers/page.tsx \
src/app/workers/[workerId]/page.tsx \
src/app/queue/page.tsx \
src/app/system/page.tsx \
src/app/system/settings/page.tsx \
src/app/login/page.tsx

########################################
# layout components
########################################

echo "📄 Creating layout components"

create_files \
src/components/layout/Sidebar.tsx \
src/components/layout/Header.tsx \
src/components/layout/Breadcrumb.tsx \
src/components/layout/PageContainer.tsx \
src/components/layout/NavigationMenu.tsx

########################################
# dashboard
########################################

create_files \
src/components/dashboard/StatsCard.tsx \
src/components/dashboard/BuildChart.tsx \
src/components/dashboard/WorkerStatus.tsx \
src/components/dashboard/QueueStatus.tsx \
src/components/dashboard/RecentBuilds.tsx

########################################
# build
########################################

create_files \
src/components/build/BuildTable.tsx \
src/components/build/BuildRow.tsx \
src/components/build/BuildFilters.tsx \
src/components/build/BuildControls.tsx \
src/components/build/BuildStatusBadge.tsx \
src/components/build/BuildDetailHeader.tsx \
src/components/build/BuildInfoPanel.tsx \
src/components/build/BuildArtifacts.tsx \
src/components/build/BuildLogViewer.tsx

########################################
# app components
########################################

create_files \
src/components/app/AppTable.tsx \
src/components/app/AppRow.tsx \
src/components/app/AppForm.tsx \
src/components/app/AppDetailPanel.tsx \
src/components/app/AppBuildHistory.tsx \
src/components/app/AppSettings.tsx

########################################
# artifact
########################################

create_files \
src/components/artifact/ArtifactTable.tsx \
src/components/artifact/ArtifactRow.tsx \
src/components/artifact/ArtifactDownload.tsx \
src/components/artifact/ArtifactInfo.tsx

########################################
# worker
########################################

create_files \
src/components/worker/WorkerTable.tsx \
src/components/worker/WorkerRow.tsx \
src/components/worker/WorkerStatusCard.tsx \
src/components/worker/WorkerDetail.tsx \
src/components/worker/WorkerJobInfo.tsx

########################################
# queue
########################################

create_files \
src/components/queue/QueueTable.tsx \
src/components/queue/QueueRow.tsx

########################################
# system
########################################

create_files \
src/components/system/SystemStatus.tsx \
src/components/system/RedisStatus.tsx \
src/components/system/DatabaseStatus.tsx \
src/components/system/WorkerHealth.tsx \
src/components/system/QueueHealth.tsx

########################################
# ui
########################################

create_files \
src/components/ui/Button.tsx \
src/components/ui/Table.tsx \
src/components/ui/Modal.tsx \
src/components/ui/Badge.tsx \
src/components/ui/Spinner.tsx \
src/components/ui/Card.tsx

########################################
# hooks
########################################

create_files \
src/hooks/useBuilds.ts \
src/hooks/useBuild.ts \
src/hooks/useBuildLogs.ts \
src/hooks/useBuildArtifacts.ts \
src/hooks/useApps.ts \
src/hooks/useApp.ts \
src/hooks/useWorkers.ts \
src/hooks/useWorker.ts \
src/hooks/useArtifacts.ts \
src/hooks/useQueue.ts \
src/hooks/useSystem.ts \
src/hooks/useWebSocket.ts

########################################
# api
########################################

create_files \
src/api/builds.ts \
src/api/apps.ts \
src/api/artifacts.ts \
src/api/workers.ts \
src/api/queue.ts \
src/api/system.ts \
src/api/settings.ts \
src/api/auth.ts

########################################
# store
########################################

create_files \
src/store/buildStore.ts \
src/store/uiStore.ts \
src/store/systemStore.ts \
src/store/workerStore.ts \
src/store/queueStore.ts

########################################
# types
########################################

create_files \
src/types/build.ts \
src/types/app.ts \
src/types/artifact.ts \
src/types/worker.ts \
src/types/queue.ts \
src/types/system.ts \
src/types/api.ts

########################################
# lib
########################################

create_files \
src/lib/apiClient.ts \
src/lib/websocket.ts \
src/lib/logStream.ts \
src/lib/format.ts \
src/lib/time.ts \
src/lib/constants.ts

########################################
# providers
########################################

create_files \
src/providers/ReactQueryProvider.tsx \
src/providers/ThemeProvider.tsx

########################################
# styles
########################################

create_files \
src/styles/variables.css

echo "✅ Wraply Admin Production Setup Complete"