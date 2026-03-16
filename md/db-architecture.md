# Wraply Database Architecture

Wraply는 모바일 웹을 Android / iOS 네이티브 앱으로 빌드하는 **CI 플랫폼**입니다.

이 문서는 Wraply의 **Database 구조와 역할**을 설명합니다.

설계 기준

- Worker 기반 Build System
- BullMQ + Redis Queue
- Artifact Storage
- WebSocket Log Streaming
- Stateless Worker Architecture

---

# ER Diagram

```
users

projects
   │
   ├── jobs
   │      │
   │      └── artifacts
   │
   └── android_signing_keys
```

---

# users

사용자 계정 정보

| column | type | description |
|------|------|-------------|
| id | BIGINT | user id |
| email | VARCHAR | login email |
| password_hash | VARCHAR | password hash |
| created_at | DATETIME | account creation time |

---

# projects

프로젝트 identity 정보

| column | description |
|------|-------------|
| id | project id |
| name | project display name |
| created_at | created time |
| updated_at | updated time |

설명

- 프로젝트 기본 정보만 저장
- build input 값은 jobs 테이블에 저장

---

# jobs

빌드 실행 기록 및 상태

| column | description |
|------|-------------|
| job_id | build job id |
| project_id | project reference |
| worker_id | worker instance id |
| build_host | physical build machine |
| platform | android / ios |
| package_name | package identifier |
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

---

# artifacts

빌드 결과물 metadata

| column | description |
|------|-------------|
| id | artifact id |
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
| project_id | project reference |
| safe_name | build safe name |
| package_name | package id |
| mode | signing mode |
| version | signing key version |
| is_active | active key |
| keystore_path | keystore file path |
| keystore_sha256 | keystore fingerprint |
| fingerprint_sha1 | SHA1 fingerprint |
| fingerprint_sha256 | SHA256 fingerprint |
| key_alias | alias |
| store_pass_enc | encrypted store password |
| key_pass_enc | encrypted key password |
| created_at | created time |
| updated_at | updated time |

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
/ci/builds/job_xxx/app.apk
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