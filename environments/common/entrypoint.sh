#!/bin/sh
set -e

if [ "$NODE_ENV" = "development" ]; then
    # Development: kör dev server direkt (volumes mountas externt)
    exec bun run dev --host 0.0.0.0
else
    # Production: bygg och kör
    if [ ! -d ".output" ]; then
        bun run build
    fi
    exec bun run start
fi
