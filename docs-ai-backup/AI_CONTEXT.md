# Wraply AI Context

## Project
Wraply

## Purpose
Wraply is a CI system that converts mobile web applications into Android and iOS native apps.
It builds APK/IPA files and distributes them via install URLs and QR codes.

## Repository
https://github.com/zzazung/wraply

## Core Flow
User → Project → Build Request → Queue → Worker → Artifact → Install URL → QR → Mobile Install

## Structure
wraply
 ├ wraply-api
 ├ wraply-worker
 ├ wraply-shared
 ├ wraply-scheduler
 ├ wraply-admin
 ├ wraply-user
 ├ tests
 └ scripts

## Technologies
- Node.js
- Express
- MariaDB
- Redis
- BullMQ
- Fastlane

## Current Goal
User → Build → APK → QR → Install