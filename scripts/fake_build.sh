#!/bin/bash

SAFE_NAME=$1

echo "🚀 fake build started"

sleep 1

mkdir -p builds/test

echo "fake apk" > builds/test/app-release.apk

echo "OUTPUT_DIR=builds/test"

echo "✅ fake build done"