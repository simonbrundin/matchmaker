import pg from "pg";

const { Pool } = pg;

export const postgresPool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://matchmaker:matchmaker@localhost:5432/matchmaker",
});
