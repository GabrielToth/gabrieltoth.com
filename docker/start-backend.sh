#!/bin/sh
# Start backend with proper Node.js heap size
exec node --max-old-space-size=512 --expose-gc /usr/local/bin/tsx src/backend/server.ts
