# Wraply System Design

Wraply는 SaaS CI 플랫폼을 목표로 한다.

---

# 핵심 구성

Client

wraply-user  
wraply-admin

Backend

wraply-api

Worker

wraply-worker

Queue

Redis + BullMQ

Storage

Artifact storage

---

# 시스템 흐름

Client

↓

API

↓

Queue

↓

Worker

↓

Build

↓

Artifact

↓

Storage

↓

Download

---

# WebSocket

로그 스트리밍

Worker

↓

Redis Pub/Sub

↓

API

↓

WebSocket

↓

Client

---

# Artifact 저장

artifact metadata DB 저장

artifact 파일 storage 저장

---

# 인증

JWT 기반 인증

Admin Role

User Role

---

# 확장

Multiple API  
Multiple Worker  
Load Balancer  
Redis Cluster