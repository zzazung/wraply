# 🧱 Wraply Database Architecture

## 📌 한 줄 정의
Wraply는 tenant 중심으로 완전히 분리된 multi-tenant CI 플랫폼 DB 구조이다.

---

## 🏗 전체 구조 (계층)

tenants
 ├ users
 ├ projects
 │   └ jobs
 │       └ artifacts
 ├ signing (android / ios)
 └ billing

---

## 🧠 핵심 설계 원칙

### 1️⃣ Tenant Isolation (절대 원칙)
- 모든 데이터는 tenant_id로 분리
- 모든 query에 tenant_id 필터 필수

예:
SELECT * FROM jobs WHERE tenant_id = ?

---

### 2️⃣ Root = Tenant
- tenant = 하나의 고객 (회사 / 개인)
- billing / 권한 / 데이터 범위 기준

---

### 3️⃣ 사용자 ≠ 시스템 중심
- user는 tenant에 속함
- 시스템은 tenant 기준으로 동작

---

## 🧩 테이블 역할

### 🏢 tenants
- 시스템 최상위 단위
- 조직 단위

컬럼:
- id (PK)
- name
- owner_user_id
- created_at
- updated_at

---

### 👤 users
- tenant 소속 사용자

컬럼:
- id (PK)
- tenant_id (FK)
- email
- password_hash
- created_at
- updated_at

제약:
- UNIQUE(email, tenant_id)

---

### 📦 projects
- 빌드 대상 앱

컬럼:
- id (PK)
- tenant_id (FK)
- name
- safe_name
- package_name
- bundle_id
- created_at
- updated_at

---

### ⚙️ jobs (핵심)
- 빌드 실행 단위

컬럼:
- job_id (PK)
- tenant_id (FK)
- project_id (FK)
- platform
- package_name
- safe_name
- app_name
- url
- scheme
- status
- progress
- worker_id
- build_host
- log_path
- artifact_dir
- heartbeat_at
- created_at
- updated_at
- finished_at
- error_reason

---

### 📁 artifacts
- 빌드 결과물

컬럼:
- id (PK)
- tenant_id (FK)
- job_id (FK)
- platform
- name
- path
- size
- created_at

---

### 🔐 signing

#### android_signing_keys
- keystore 저장

컬럼:
- id
- tenant_id
- project_id
- keystore_path
- alias

#### ios_signing_assets
- 인증서 + 프로파일

컬럼:
- id
- tenant_id
- bundle_id
- cert_path
- profile_path

---

### 💳 billing
- 결제 및 플랜 관리 (tenant 기준)

컬럼:
- tenant_id (PK)
- plan (free / pro / team)
- status (active / canceled / past_due)
- current_period_end
- created_at
- updated_at

---

## 🔄 데이터 흐름 (Build 기준)

Client
 → POST /jobs
 → enqueueBuild
 → Worker 실행
 → artifacts 생성
 → DB 저장
 → WebSocket broadcast

---

## 🔐 보안 구조

### 1. DB
- tenant_id 필수
- foreign key + cascade

### 2. API
- req.user.tenantId 기반
- tenantDb 강제 적용

### 3. WebSocket
- JWT에서 tenant 추출
- job tenant 검증

### 4. DB Guard
- tenant 없는 query 실행 차단

---

## ⚡ 성능 설계

인덱스:
- tenant_id
- project_id
- job_id
- status

대표 쿼리:
SELECT * FROM jobs
WHERE tenant_id = ?
ORDER BY created_at DESC

---

## 🚀 확장 구조

### Role 시스템
- users.role 추가

### 팀 기능
- team_members 테이블

### Usage metering
- jobs count 기반 과금

### Stripe 연동
- billing + stripe_customer_id

---

## 💣 금지 사항

❌ tenant 없는 query
SELECT * FROM jobs;

❌ client tenant 신뢰
req.body.tenantId

❌ cross-tenant join

---

## 🔥 최종 요약

Wraply DB는 단순 저장소가 아니라
tenant isolation을 중심으로 설계된 SaaS 핵심 구조이다.