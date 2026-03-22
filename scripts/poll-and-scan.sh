#!/bin/bash
# Poll for pending scan requests and execute them
# Run this script in the background on your Mac

while true; do
  node ~/.openclaw/workspace/scripts/reddit-scan-worker.mjs
  sleep 30
done
