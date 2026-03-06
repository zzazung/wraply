# Wraply Architecture Overview

## Modules

wraply-api
REST API for project management and build requests.

wraply-worker
Build execution engine running Fastlane.

wraply-shared
Shared modules such as DB access and job state definitions.

wraply-scheduler
Background jobs for system maintenance.

## Build Pipeline

User
 ↓
API
 ↓
Queue
 ↓
Worker
 ↓
Artifact
 ↓
Install