# Wraply Build Pipeline

Wraply 빌드 파이프라인 설명

---

# Build Request

POST /projects/:id/build

↓

enqueueBuild()

↓

Redis Queue

---

# Worker 실행

buildConsumer

↓

buildWorker

---

# Build 단계

1 preparing

2 patching

3 building

4 signing

5 uploading

6 finished

---

# Android

scripts/build_android_fastlane.sh

---

# iOS

scripts/build_ios_fastlane.sh

---

# Patch

scripts/patch_android.sh

scripts/patch_ios.sh

---

# Template Sync

scripts/sync_from_templates.sh

---

# Artifact Scan

build 완료 후 artifact scan

DB metadata 저장

---

# Log

worker emit log

↓

redis pubsub

↓

api

↓

websocket

↓

client