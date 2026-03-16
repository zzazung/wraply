#!/usr/bin/env bash
set -e

CERT="AppleWWDRCAG3.cer"

echo "Downloading Apple WWDR certificate..."

curl -L -o $CERT \
https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer

echo "Installing WWDR certificate..."

security add-trusted-cert \
  -d -r trustRoot \
  -k ~/Library/Keychains/login.keychain-db \
  $CERT

echo "WWDR certificate installed"