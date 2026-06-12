#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running seed..."
node dist/prisma/seed.js

echo "Starting application..."
exec node dist/src/main