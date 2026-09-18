#!/bin/bash
# Kopierar databas från main till worktree automatiskt
# Körs via Tilt när AUTO_COPY_DB=true

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_DIR="$PROJECT_DIR/environments/dev"

TARGET_HOST=${1:-localhost}

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

# Hämta target port från docker compose
TARGET_PORT=$(docker compose -f "$COMPOSE_DIR/docker-compose.yml" port postgres 5432 2>/dev/null | cut -d: -f2)

if [ -z "$TARGET_PORT" ]; then
    echo "Kunde inte hitta postgres port. Kör 'tilt up' först."
    exit 1
fi

# Hämta current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

echo "Current branch: $CURRENT_BRANCH"

# Om vi är på main, finns det ingen "main" att kopiera från
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "Vi är på main-branch - skippar databaskopiering"
    exit 0
fi

# Hämta vår egen container (för att exkludera den)
OUR_CONTAINER=$(docker compose -f "$COMPOSE_DIR/docker-compose.yml" ps postgres --format '{{.Name}}' 2>/dev/null)

# Sök efter postgres-containers som INTE är vår egen
ALL_PGS=$(docker ps --format '{{.Names}}' | grep postgres | grep -v "$OUR_CONTAINER" 2>/dev/null || echo "")
SOURCE_CONTAINER=$(echo "$ALL_PGS" | head -1)

if [ -z "$SOURCE_CONTAINER" ]; then
    echo "Ingen main-postgres container hittades."
    echo "Startar du main-projektet? Kopiering skippas."
    exit 0
fi

# Hämta postgres-porten för source
SOURCE_PORT=$(docker port "$SOURCE_CONTAINER" 5432/tcp 2>/dev/null | cut -d: -f2)

if [ -z "$SOURCE_PORT" ]; then
    echo "Kunde inte hitta postgres-port för $SOURCE_CONTAINER"
    exit 1
fi

echo ""
echo "Kopierar databas..."
echo "  Source: $SOURCE_CONTAINER (port $SOURCE_PORT)"
echo "  Target: matchmaker-dev-postgres (port $TARGET_PORT)"
echo ""

# Dumpa och restore
pg_dump -h localhost -p "$SOURCE_PORT" -U matchmaker -d matchmaker | \
    psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U matchmaker -d matchmaker

echo ""
echo "Klart! Databasen har kopierats."
