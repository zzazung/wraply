# Wraply Architecture

Wraply는 모바일 웹앱을 자동으로 네이티브 앱으로 빌드하는 CI 시스템이다.

---

# 시스템 구성

wraply
 ├ wraply-api
 ├ wraply-worker
 ├ wraply-shared
 ├ wraply-admin
 ├ wraply-user
 ├ tests
 └ scripts

---

# 각 컴포넌트 역할

## wraply-api

REST API

- 인증
- 프로젝트 관리
- 빌드 요청
- artifact 제공
- websocket 로그

---

## wraply-worker

빌드 실행

- 템플릿 패치
- fastlane 실행
- artifact 생성

---

## wraply-shared

공통 모듈

- db
- queue
- job state

---

## wraply-admin

관리자 페이지

기능

- 전체 빌드 현황
- worker 상태
- queue 상태
- 사용자 관리
- 프로젝트 관리

---

## wraply-user

사용자 페이지

기능

- 프로젝트 관리
- 빌드 관리
- artifact 다운로드
- 로그 보기

---

# 데이터 흐름

User

↓

wraply-user

↓

wraply-api

↓

Redis Queue

↓

wraply-worker

↓

Artifact 생성

↓

DB 저장

↓

wraply-api

↓

User Download