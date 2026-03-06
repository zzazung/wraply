# Wraply System Architecture

Main Components

API Server
Handles build requests and user actions

Worker Nodes
Execute builds

Redis Queue
Manages job distribution

Scheduler
Recovers stuck jobs and runs maintenance tasks

Database
Stores projects, builds and artifacts

WebSocket
Streams build logs