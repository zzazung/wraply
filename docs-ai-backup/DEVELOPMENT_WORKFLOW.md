# Wraply Development Workflow

Recommended AI-assisted workflow:

1. Define feature goal
2. Identify files to modify
3. Generate full source code
4. Write tests
5. Validate build pipeline

## Example

Feature: APK Install Flow

Files:
- wraply-api/routes/install.js
- wraply-api/routes/artifacts.js
- wraply-worker/queue/buildWorker.js