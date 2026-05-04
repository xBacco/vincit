#!/bin/bash
cd /Users/skafiskafnjak/Documents/claude.code/betcouple

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
  npm run build
fi

# Start single Express server (serves both API and frontend)
npm run start >> betcouple.log 2>&1
