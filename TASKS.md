# Wraply Development Tasks

## MVP Goal
Enable full build-to-install flow.

User → Build → APK → QR → Install

## Core Tasks

1. Build trigger API
2. Queue build job
3. Worker executes build
4. Artifact detection
5. Artifact download API
6. Install URL generation
7. QR code generation
8. Mobile installation testing

## Future Tasks

- Worker autoscaling
- Artifact cloud storage
- CI dashboard
- Distributed workers