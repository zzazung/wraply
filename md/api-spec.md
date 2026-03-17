# Wraply API Specification

Wraply API는 모바일 웹을 Android / iOS 네이티브 앱으로 빌드하기 위한 **Multi-Tenant CI 플랫폼 API**입니다.

기본 URL

```
http://localhost:4000
```

Production Example

```
https://api.wraply.app
```

---

# Authentication

대부분의 API는 **JWT 인증**을 사용합니다.

Header

```
Authorization: Bearer <token>
```

개발 환경에서는 다음 토큰을 사용할 수 있습니다.

```
Authorization: Bearer dev-user
```

조건

```
WRAPLY_DEV=true
```

JWT payload에는 다음 정보가 포함됩니다.

```
userId
tenantId
```

---

# API Overview

| Method | Endpoint | Description |
|------|------|-------------|
| POST | /auth/login | 사용자 로그인 |
| GET | /tenants | tenant 목록 |
| POST | /tenants | tenant 생성 |
| GET | /projects | 프로젝트 목록 |
| POST | /projects | 프로젝트 생성 |
| GET | /projects/:projectId | 프로젝트 조회 |
| GET | /projects/:projectId/builds | 프로젝트 빌드 히스토리 |
| POST | /jobs | 빌드 요청 |
| GET | /jobs | 빌드 목록 |
| GET | /jobs/:jobId | 빌드 상세 |
| GET | /jobs/:jobId/log | 빌드 로그 |
| GET | /jobs/:jobId/artifacts | 빌드 결과물 |
| POST | /jobs/:jobId/cancel | 빌드 취소 |
| DELETE | /jobs | 빌드 삭제 |
| GET | /artifacts/:artifactId | artifact 정보 |
| GET | /install/:artifactId | 앱 설치 |
| GET | /apple-accounts | Apple 계정 목록 |
| POST | /apple-accounts | Apple 계정 등록 |

---

# Auth API

## POST /auth/login

사용자 로그인

Request

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response

```json
{
  "token": "jwt_token",
  "userId": "user_1",
  "tenantId": "tenant_1"
}
```

---

# Tenants API

## GET /tenants

Tenant 목록 조회

Response

```json
{
  "items": [
    {
      "id": "tenant_1",
      "name": "Acme Inc"
    }
  ]
}
```

---

## POST /tenants

Tenant 생성

Request

```json
{
  "name": "Acme Inc"
}
```

Response

```json
{
  "id": "tenant_1"
}
```

---

# Projects API

## GET /projects

Tenant 기준 프로젝트 목록

Request

```
GET /projects
```

Response

```json
{
  "items": [
    {
      "id": "project_1",
      "tenant_id": "tenant_1",
      "name": "My App",
      "safe_name": "my_app",
      "package_name": "com.example.app",
      "bundle_id": "com.example.app",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## POST /projects

프로젝트 생성

Request

```json
{
  "name": "My App",
  "packageName": "com.example.app",
  "bundleId": "com.example.app"
}
```

Response

```json
{
  "id": "project_123"
}
```

---

## GET /projects/:projectId

프로젝트 조회

Response

```json
{
  "id": "project_123",
  "tenant_id": "tenant_1",
  "name": "My App",
  "safe_name": "my_app",
  "package_name": "com.example.app",
  "bundle_id": "com.example.app"
}
```

---

## GET /projects/:projectId/builds

프로젝트 빌드 히스토리

Response

```json
{
  "items": [
    {
      "job_id": "job_123",
      "tenant_id": "tenant_1",
      "platform": "android",
      "status": "building",
      "progress": 60,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

# Jobs API

## POST /jobs

빌드 요청

Request

```json
{
  "projectId": "project_123",
  "platform": "android",
  "packageName": "com.example.app",
  "bundleId": "com.example.app",
  "appName": "My App",
  "url": "https://example.com"
}
```

Response

```json
{
  "success": true,
  "jobId": "job_abc123"
}
```

Worker Payload Example

```json
{
  "jobId": "job_abc123",
  "tenantId": "tenant_1",
  "projectId": "project_123",
  "platform": "android",
  "packageName": "com.example.app",
  "bundleId": "com.example.app",
  "url": "https://example.com"
}
```

---

## GET /jobs

빌드 목록

Response

```json
{
  "items": [
    {
      "job_id": "job_123",
      "tenant_id": "tenant_1",
      "platform": "android",
      "status": "building",
      "progress": 45
    }
  ]
}
```

---

## GET /jobs/:jobId

빌드 상세 정보

Response

```json
{
  "job_id": "job_123",
  "tenant_id": "tenant_1",
  "platform": "android",
  "status": "building",
  "progress": 50,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

## GET /jobs/:jobId/log

빌드 로그 조회

Response

```
[10:01:01] Preparing build
[10:01:05] Running patch
[10:01:10] Building APK
```

Content-Type

```
text/plain
```

---

## GET /jobs/:jobId/artifacts

빌드 결과물

Response

```json
{
  "items": [
    {
      "id": "artifact_123",
      "tenant_id": "tenant_1",
      "platform": "android",
      "downloadUrl": "/downloads/android/tenant_1/job_123/app.apk",
      "size": 23452345,
      "createdAt": 170000000
    }
  ]
}
```

---

## POST /jobs/:jobId/cancel

빌드 취소

Response

```json
{
  "success": true
}
```

---

## DELETE /jobs

빌드 삭제

Request

```json
{
  "jobIds": [
    "job_123",
    "job_456"
  ]
}
```

Response

```json
{
  "success": true,
  "deletedCount": 2
}
```

---

# Artifacts API

## GET /artifacts/:artifactId

artifact 정보 조회

Response

```json
{
  "id": "artifact_123",
  "tenant_id": "tenant_1",
  "platform": "android",
  "downloadUrl": "/downloads/android/tenant_1/job_123/app.apk",
  "size": 23452345
}
```

---

# Install API

## GET /install/:artifactId

모바일 앱 설치 링크

Android

```
apk download
```

iOS

```
itms-services install
```

---

# Apple Accounts API

## GET /apple-accounts

Apple Developer 계정 목록

Response

```json
{
  "items": [
    {
      "id": "apple_1",
      "tenant_id": "tenant_1",
      "apple_id": "dev@example.com",
      "team_id": "ABCDE12345"
    }
  ]
}
```

---

## POST /apple-accounts

Apple Developer 계정 등록

Request

```json
{
  "appleId": "dev@example.com",
  "teamId": "ABCDE12345"
}
```

Response

```json
{
  "id": "apple_1"
}
```

---

# WebSocket API

빌드 로그 스트리밍

Endpoint

```
ws://localhost:4000?jobId=job_123&tenantId=tenant_1
```

Message Types

log

```json
{
  "type": "log",
  "jobId": "job_123",
  "tenantId": "tenant_1",
  "message": "Building APK...",
  "ts": 170000000
}
```

status

```json
{
  "type": "status",
  "jobId": "job_123",
  "tenantId": "tenant_1",
  "status": "building",
  "progress": 40,
  "ts": 170000000
}
```

---

# Internal API

Worker 전용 API

Header

```
x-worker-token: WORKER_TOKEN
```

Example

```
POST /internal/build/start
POST /internal/build/finish
```

---

# Error Format

모든 API 에러는 다음 형식을 사용합니다.

```json
{
  "error": "error message"
}
```

---

# Status Codes

| code | description |
|----|-------------|
| 200 | success |
| 400 | bad request |
| 401 | unauthorized |
| 404 | not found |
| 500 | internal error |