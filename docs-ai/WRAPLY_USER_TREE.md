wraply-user
└ src
  ├ app
  │ ├ router.tsx
  │ └ routes
  │   ├ accountRoutes.tsx
  │   ├ buildRoutes.tsx
  │   ├ certificateRoutes.tsx
  │   ├ dashboardRoutes.tsx
  │   ├ installRoutes.tsx
  │   ├ projectRoutes.tsx
  │   ├ protectedRoutes.tsx
  │   └ publicRoutes.tsx
  ├ components
  │ ├ artifact
  │ │ ├ ArtifactCard.tsx
  │ │ ├ ArtifactDownload.tsx
  │ │ ├ ArtifactQR.tsx
  │ │ ├ InstallGuide.tsx
  │ │ └ InstallQR.tsx
  │ ├ auth
  │ │ ├ AuthGuard.tsx
  │ │ └ GuestGuard.tsx
  │ ├ build
  │ │ ├ BuildArtifacts.tsx
  │ │ ├ BuildCard.tsx
  │ │ ├ BuildEmpty.tsx
  │ │ ├ BuildHeader.tsx
  │ │ ├ BuildHistoryTable.tsx
  │ │ ├ BuildLauncher.tsx
  │ │ ├ BuildLogViewer.tsx
  │ │ ├ BuildProgress.tsx
  │ │ ├ BuildStatusBadge.tsx
  │ │ └ BuildTimeline.tsx
  │ ├ layout
  │ │ ├ AppLayout.tsx
  │ │ ├ AuthLayout.tsx
  │ │ ├ DashboardLayout.tsx
  │ │ ├ Header.tsx
  │ │ ├ InstallLayout.tsx
  │ │ └ SideBar.tsx
  │ ├ projects
  │ │ ├ ProjectCard.tsx
  │ │ ├ ProjectCreateModal.tsx
  │ │ └ ProjectForm.tsx
  │ └ ui
  │   ├ Badge.tsx
  │   ├ Button.tsx
  │   ├ Card.tsx
  │   ├ Input.tsx
  │   ├ Modal.tsx
  │   ├ Select.tsx
  │   ├ Spinner.tsx
  │   └ Table.tsx
  ├ hooks
  │ ├ useArtifacts.ts
  │ ├ useAuth.ts
  │ ├ useBuild.ts
  │ ├ useBuildLogs.ts
  │ ├ useProjects.ts
  │ └ useWebSocket.ts
  ├ pages
  │ ├ account
  │ │ └ AccountPage.tsx
  │ ├ auth
  │ │ └ LoginPage.tsx
  │ ├ builds
  │ │ ├ BuildCenterPage.tsx
  │ │ └ BuildDetailPage.tsx
  │ ├ certificates
  │ │ └ CertificatesPage.tsx
  │ ├ dashboard
  │ │ └ DashboardPage.tsx
  │ ├ install
  │ │ └ InstallPage.tsx
  │ └ projects
  │   ├ ProjectCreatePage.tsx
  │   ├ ProjectDetailPage.tsx
  │   └ ProjectPage.tsx
  ├ providers
  │ └ WebSocketProvider.ts
  ├ services
  │ ├ api.ts
  │ ├ artifacts.ts
  │ ├ builds.ts
  │ ├ certificates.ts
  │ ├ projects.ts
  │ └ websocket.ts
  ├ stores
  │ ├ authStore.ts
  │ └ buildStore.ts
  ├ styles
  │ └ globals.css
  ├ types
  │ ├ api.ts
  │ ├ artifact.ts
  │ ├ build.ts
  │ ├ index.ts
  │ ├ log.ts
  │ ├ project.ts
  │ ├ user.ts
  │ └ ws.ts
  └ utils
    ├ buildStatus.ts
    └ formatDate.ts