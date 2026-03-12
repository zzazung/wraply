# Wraply User UI 구조

wraply-user 프론트엔드 프로젝트의 현재 구조를 정의한다.

AI와 협업할 때 반드시 이 문서를 기준으로 작업한다.

---

# 기술 스택

React  
TypeScript  
Vite  
TailwindCSS v4  
shadcn/ui  

---

# UI 기본 원칙

모든 사용자 텍스트는 한글 사용  
TailwindCSS v4 사용  
hover / click UX 적용  
globals.css 테마 사용  
SaaS 수준 UI 유지  

---

# 디렉토리 구조

src

app  
router.tsx  

pages  

projects  
ProjectPage.tsx  

builds  
BuildPage.tsx  
BuildDetailPage.tsx  

install  
InstallPage.tsx  

components  

ui  

Button.tsx  
Input.tsx  
Select.tsx  
Card.tsx  
Modal.tsx  
Badge.tsx  
Table.tsx  
Spinner.tsx  

projects  

ProjectCreateModal.tsx  

build  

BuildStatusBadge.tsx  
BuildCard.tsx  
BuildProgress.tsx  
BuildHeader.tsx  
BuildLogViewer.tsx  
BuildArtifacts.tsx  
ArtifactCard.tsx  
ArtifactDownload.tsx  
InstallQR.tsx  
BuildEmpty.tsx  

services  

api.ts  
projects.ts  
builds.ts  
artifacts.ts  

hooks  

useProjects.ts  
useBuild.ts  
useBuildLogs.ts  

types  

project.ts  
build.ts  
artifact.ts  

styles  

globals.css  

---

# UI 흐름

프로젝트 생성

ProjectPage  
→ ProjectCreateModal  
→ POST /projects  

빌드 시작

POST /projects/:projectId/builds  

빌드 상세

BuildPage  
→ BuildDetailPage  
→ BuildHeader  
→ BuildProgress  
→ BuildLogViewer  
→ BuildArtifacts  

설치

ArtifactDownload  
→ InstallQR  
→ InstallPage  

---

# AI 작업 규칙

기존 파일이 존재하면 수정한다  
동일 기능 파일을 새로 만들지 않는다  
components/ui 재사용  
모든 UI 텍스트는 한글  
TailwindCSS v4 사용  
세미콜론 유지  