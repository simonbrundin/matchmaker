#!/bin/bash
# Kopierar databas från main till current branch
# Körs via Tilt

set -e

COMPOSE_DIR="/home/simon/repos/matchmaker/environments/dev"

# Vänta tills postgres är redo
for i in {1..30}; do
    PORT=$(docker compose -f "$COMPOSE_DIR/docker-compose.yml" port postgres 5432 2>/dev/null | cut -d: -f2)
    if [ -n "$PORT" ]; then
        if pg_isready -h localhost -p "$PORT" -U matchmaker >/dev/null 2>&1; then
            break
        fi
    fi
    echo "Väntar på postgres... ($i/30)"
    sleep 1
done

TARGET_PORT=$(docker compose -f "$COMPOSE_DIR/docker-compose.yml" port postgres 5432 2>/dev/null | cut -d: -f2)

if [ -z "$TARGET_PORT" ]; then
    echo "Kunde inte hitta postgres port. Kör 'tilt up' först."
    exit 1
fi

CURRENT_BRANCH=$(git -C /home/simon/repos/matchmaker rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "Vi är på main-branch - skippar databaskopiering"
    exit 0
fi

# Sök efter main-postgres container
SOURCE_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E "^main.*postgres|^matchmaker.*postgres" | grep -v "dev-postgres" | head -1 || echo "")

if [ -z "$SOURCE_CONTAINER" ]; then
    echo "Ingen main-postgres container hittades."
    echo "Startar du main-projektet? Kopiering skippas."
    exit 0
fi

SOURCE_PORT=$(docker port "$SOURCE_CONTAINER" 5432/tcp 2>/dev/null | cut -d: -f2)

if [ -z "$SOURCE_PORT" ]; then
    echo "Kunde inte hitta postgres-port för $SOURCE_CONTAINER"
    exit 1
fi

echo ""
echo "Kopierar databas..."
echo "  Source: $SOURCE_CONTAINER (port $SOURCE_PORT)"
echo "  Target: dev-postgres (port $TARGET_PORT)"
echo ""

pg_dump -h localhost -p "$SOURCE_PORT" -U matchmaker -d matchmaker | \
    psql -h localhost -p "$TARGET_PORT" -U matchmaker -d matchmaker

echo ""
echo "Klart! Databasen har kopierats."
