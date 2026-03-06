# Wraply AI Context

Project: Wraply

Wraply is a CI system that converts mobile web applications into Android and iOS native apps.
It builds APK/IPA files and distributes them via install URLs and QR codes.

Repository
https://github.com/zzazung/wraply

Core Pipeline

User
 → Project
 → Build Request
 → Queue
 → Worker
 → Artifact
 → Install URL
 → QR Code
 → Mobile Install

Core Modules

wraply-api
wraply-worker
wraply-shared
wraply-scheduler
wraply-admin (future)
wraply-user (future)
tests
scripts