# Wraply Database Architecture

Wraply는 모바일 웹을 Android / iOS 네이티브 앱으로 빌드하는 **Multi-Tenant CI 플랫폼**입니다.

이 문서는 Wraply의 **Database 구조와 역할**을 설명합니다.

설계 기준

- Multi-Tenant Architecture
- Worker 기반 Build System
- BullMQ + Redis Queue
- Artifact Storage
- WebSocket Log Streaming
- Stateless Worker Architecture
- Signing Asset Reuse

---

# ER Diagram

```
tenants
   │
   ├── users
   │
   ├── projects
   │      │
   │      ├── jobs
   │      │      │
   │      │      └── artifacts
   │      │
   │      ├── android_signing_keys
   │      │
   │      └── ios_signing_assets
   │
   └── apple_accounts
```

---

# tenants

Wraply의 **Multi-Tenant 핵심 테이블**

| column | type | description |
|------|------|-------------|
| id | VARCHAR(36) | tenant id |
| name | VARCHAR | tenant display name |
| owner_user_id | VARCHAR(36) | owner user |
| created_at | DATETIME | created time |
| updated_at | DATETIME | updated time |

설명

- Wraply는 **Multi-Tenant CI 플랫폼**
- 모든 프로젝트와 signing asset은 tenant 단위로 분리됨

---

# users

사용자 계정 정보

| column | type | description |
|------|------|-------------|
| id | VARCHAR(36) | user id |
| tenant_id | VARCHAR(36) | tenant reference |
| email | VARCHAR | login email |
| password_hash | VARCHAR | password hash |
| created_at | DATETIME | account creation time |

설명

- 사용자는 반드시 하나의 tenant에 속함

---

# apple_accounts

사용자가 연결한 Apple Developer 계정

| column | type | description |
|------|------|-------------|
| id | VARCHAR(36) | apple account id |
| tenant_id | VARCHAR(36) | tenant reference |
| apple_id | VARCHAR | Apple login email |
| team_id | VARCHAR | Apple Developer Team ID |
| session | TEXT | fastlane session cache |
| created_at | DATETIME | created time |
| updated_at | DATETIME | updated time |

설명

- tenant별 Apple 계정 연결
- Fastlane session 캐시 저장 가능

---

# projects

프로젝트 identity 정보

| column | description |
|------|-------------|
| id | project id |
| tenant_id | tenant reference |
| name | project display name |
| platform | android / ios |
| package_name | android package |
| bundle_id | ios bundle id |
| created_at | created time |
| updated_at | updated time |

설명

- 프로젝트 기본 정보 저장
- Build 입력 값은 jobs 테이블에 저장

---

# jobs

빌드 실행 기록 및 상태

| column | description |
|------|-------------|
| job_id | build job id |
| tenant_id | tenant reference |
| project_id | project reference |
| worker_id | worker instance id |
| build_host | physical build machine |
| platform | android / ios |
| package_name | package identifier |
| bundle_id | ios bundle identifier |
| safe_name | safe build name |
| app_name | build app name |
| url | target service url |
| scheme | ios scheme |
| status | build status |
| progress | build progress |
| log_path | build log location |
| artifact_dir | artifact directory |
| download_base_url | artifact base url |
| signing_key_id | signing key reference |
| signing_mode | signing mode |
| heartbeat_at | worker heartbeat |
| retry_count | retry count |
| max_retry | max retry |
| created_at | job created time |
| updated_at | last update time |
| finished_at | build finished time |
| error_reason | build error reason |

설명

- Worker 상태 및 Build 진행 상황 저장
- WebSocket 로그 스트리밍과 연동

---

# artifacts

빌드 결과물 metadata

| column | description |
|------|-------------|
| id | artifact id |
| tenant_id | tenant reference |
| job_id | build job reference |
| platform | android / ios |
| type | artifact type |
| name | file name |
| path | artifact path |
| size | file size |
| checksum | integrity hash |
| created_at | created time |

Example API Response

```json
{
  "id": "artifact_123",
  "platform": "android",
  "downloadUrl": "https://cdn.wraply.app/artifacts/123/app.apk",
  "size": 24562342,
  "createdAt": 170000000
}
```

---

# android_signing_keys

Android signing key 관리

| column | description |
|------|-------------|
| id | signing key id |
| tenant_id | tenant reference |
| safe_name | build safe name |
| package_name | package id |
| mode | signing mode |
| keystore_path | keystore file path |
| keystore_sha256 | keystore fingerprint |
| fingerprint_sha1 | SHA1 fingerprint |
| fingerprint_sha256 | SHA256 fingerprint |
| key_alias | alias |
| store_pass_enc | encrypted store password |
| key_pass_enc | encrypted key password |
| created_at | created time |
| updated_at | updated time |

설명

- tenant별 Android keystore 관리
- 동일 package_name이라도 tenant별로 분리 가능

예

```
tenantA → com.app
tenantB → com.app
```

---

# ios_signing_assets

iOS signing asset 관리

| column | description |
|------|-------------|
| id | asset id |
| tenant_id | tenant reference |
| bundle_id | iOS bundle id |
| certificate_name | certificate identifier |
| provisioning_uuid | provisioning profile uuid |
| created_at | created time |
| updated_at | updated time |

설명

- tenant별 iOS signing asset 관리
- provisioning / certificate reuse 가능

---

# Queue System

Wraply는 **BullMQ + Redis 기반 queue**를 사용합니다.

따라서 다음 테이블은 사용하지 않습니다.

```
job_queue
```

Queue Flow

```
Client
   ↓
Wraply API
   ↓
BullMQ Queue
   ↓
Redis
   ↓
Worker
```

---

# Worker Architecture

Worker 정보는 jobs 테이블에 기록됩니다.

| column | description |
|------|-------------|
| worker_id | worker instance |
| build_host | physical machine |

Example

```
worker_id = worker-02
build_host = mac-mini-m1
```

---

# Build State Machine

Wraply 빌드는 다음 상태 머신을 사용합니다.

```
queued
preparing
patching
building
signing
uploading
finished
failed
```

---

# Artifact Storage

artifact는 파일 시스템 또는 object storage에 저장됩니다.

Example

```
/artifacts/android/<tenant_id>/<job_id>/app.apk
/artifacts/ios/<tenant_id>/<job_id>/app.ipa
```

Download

```
/downloads/{artifact_path}
```

---

# Wraply CI Architecture

```
Client
   ↓
Wraply API
   ↓
BullMQ Queue
   ↓
Redis
   ↓
Worker
   ↓
Artifact Storage
```

---

# Signing Storage (Filesystem)

Signing asset은 filesystem에 tenant 기준으로 저장됩니다.

```
signing
 ├ ios
 │   └ tenants
 │       └ <tenant_id>
 │           ├ certs
 │           ├ profiles
 │           └ keychains
 │
 └ android
     └ tenants
         └ <tenant_id>
             └ <package_name>
                 ├ managed.jks
                 └ metadata.json
```

---

# Multi-Tenant Principle

Wraply의 모든 핵심 데이터는 **tenant 기준으로 분리됩니다**

```
tenant
   │
   ├ projects
   │
   ├ jobs
   │
   ├ ios signing
   │
   └ android signing
```

이를 통해

- multi-organization 지원
- signing isolation
- build isolation

을 보장합니다.