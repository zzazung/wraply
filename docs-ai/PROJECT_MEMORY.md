# Wraply Project Memory

System Type

Mobile App CI Build Platform

Main Components

wraply-api
REST API for build requests and project management

wraply-worker
Build execution engine

wraply-shared
Shared database and utilities

wraply-scheduler
Background job management

Core Pipeline

User
 → Build
 → Queue
 → Worker
 → Artifact
 → Install URL
 → QR Code
 → Install