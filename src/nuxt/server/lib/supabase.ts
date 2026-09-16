import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://matchmaker:matchmaker@localhost:5432/matchmaker";
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Create a Supabase-like client interface
export class PostgresClient {
  private pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  from(table: string) {
    return new TableQuery(this.pool, table);
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      return true;
    } catch {
      return false;
    }
  }
}

class TableQuery {
  private pool: pg.Pool;
  private table: string;
  private selectColumns = "*";
  private filters: {
    type: "and" | "or";
    condition: string;
    params: unknown[];
  }[] = [];
  private notFilters: { condition: string; params: unknown[] }[] = [];
  private sortColumns: { column: string; ascending: boolean }[] = [];
  private limitValue?: number;
  private isSingle = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private insertData?: Record<string, unknown>;
  private updateData?: Record<string, unknown>;
  private isDelete = false;

  constructor(pool: pg.Pool, table: string) {
    this.pool = pool;
    this.table = table;
  }

  select(columns: string) {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({
      type: "and",
      condition: `${column} = $${this.filters.length + 1}`,
      params: [value],
    });
    return this;
  }

  in(column: string, values: unknown[]) {
    const placeholders = values
      .map((_, i) => `$${this.filters.length + i + 1}`)
      .join(", ");
    this.filters.push({
      type: "and",
      condition: `${column} IN (${placeholders})`,
      params: values,
    });
    return this;
  }

  not(column: string, op: string, value: unknown) {
    this.notFilters.push({
      condition: `${column} ${op} $${this.notFilters.length + 1}`,
      params: [value],
    });
    return this;
  }

  or(filter: string) {
    // Parse Supabase or filter syntax: "column.eq.value,column2.eq.value2"
    const conditions = filter.split(",").map((c) => c.trim());
    const subFilters: string[] = [];

    for (const cond of conditions) {
      const match = cond.match(/^(\w+)\.(\w+)\.(.+)$/);
      if (match) {
        const [, column, operator, rawValue] = match;
        const paramIndex =
          this.filters.length + this.notFilters.length + subFilters.length + 1;
        let condition: string;
        let paramValue: string = rawValue ?? "";

        // Handle operators
        if (operator === "eq") {
          condition = `${column} = $${paramIndex}`;
        } else if (operator === "ilike") {
          condition = `${column} ILIKE $${paramIndex}`;
          paramValue = paramValue.replace(/^\*/, "%").replace(/\*$/, "%");
        } else if (operator === "like") {
          condition = `${column} LIKE $${paramIndex}`;
          paramValue = paramValue.replace(/^\*/, "%").replace(/\*$/, "%");
        } else {
          condition = `${column} ${operator} $${paramIndex}`;
        }

        subFilters.push(condition);
        this.filters.push({ type: "or", condition: "", params: [paramValue] });
      }
    }

    if (subFilters.length > 0) {
      const orFilters = this.filters.filter((f) => f.type === "or");
      if (orFilters.length > 0 && subFilters.length > 0) {
        orFilters[0].condition = `(${subFilters.join(" OR ")})`;
      }
    }

    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortColumns.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Insert data
  insert(data: Record<string, unknown>) {
    this.insertData = data;
    return this;
  }

  // Update data
  update(data: Record<string, unknown>) {
    this.updateData = data;
    return this;
  }

  // Delete data
  delete() {
    this.isDelete = true;
    return this;
  }

  // Execute query
  async then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: TResult1 | null;
          error: null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const client = await this.pool.connect();
    try {
      let sql = "";
      let params: unknown[] = [];

      // INSERT
      if (this.insertData) {
        const columns = Object.keys(this.insertData);
        const values = Object.values(this.insertData);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        sql = `INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
        params = values;
        const result = await client.query(sql, params);
        return onfulfilled
          ? onfulfilled({ data: result.rows[0] || null, error: null })
          : (result.rows[0] as any);
      }

      // UPDATE
      if (this.updateData) {
        const setColumns = Object.keys(this.updateData);
        const setValues = Object.values(this.updateData);
        const setClause = setColumns
          .map((col, i) => `${col} = $${i + 1}`)
          .join(", ");

        // Build WHERE clause from filters
        const whereParts: string[] = [];
        for (const f of this.filters.filter((f) => f.type === "and")) {
          whereParts.push(f.condition);
          params.push(...f.params);
        }

        sql = `UPDATE ${this.table} SET ${setClause} WHERE ${whereParts.join(" AND ")} RETURNING *`;
        params = [...setValues, ...params];
        const result = await client.query(sql, params);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return onfulfilled
          ? onfulfilled({ data: result.rows as any, error: null })
          : (result.rows as any);
      }

      // DELETE
      if (this.isDelete) {
        const whereParts: string[] = [];
        params = [];
        for (const f of this.filters.filter((f) => f.type === "and")) {
          whereParts.push(f.condition);
          params.push(...f.params);
        }
        for (const f of this.notFilters) {
          whereParts.push(`NOT ${f.condition}`);
          params.push(...f.params);
        }

        sql = `DELETE FROM ${this.table} WHERE ${whereParts.join(" AND ")} RETURNING *`;
        const result = await client.query(sql, params);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return onfulfilled
          ? onfulfilled({ data: result.rows as any, error: null })
          : (result.rows as any);
      }

      // SELECT
      sql = `SELECT ${this.selectColumns} FROM ${this.table}`;
      const whereParts: string[] = [];
      params = [];

      for (const f of this.filters) {
        if (f.type === "and") {
          whereParts.push(f.condition);
          params.push(...f.params);
        } else if (f.condition) {
          whereParts.push(f.condition);
          params.push(...f.params);
        }
      }

      for (const f of this.notFilters) {
        whereParts.push(`NOT ${f.condition}`);
        params.push(...f.params);
      }

      if (whereParts.length > 0) {
        sql += ` WHERE ${whereParts.join(" AND ")}`;
      }

      if (this.sortColumns.length > 0) {
        sql += ` ORDER BY ${this.sortColumns.map((s) => `${s.column} ${s.ascending ? "ASC" : "DESC"}`).join(", ")}`;
      }

      if (this.limitValue) {
        sql += ` LIMIT ${this.limitValue}`;
      }

      const result = await client.query(sql, params);
      let data = result.rows;

      if (this.isSingle) {
        data = data[0] || null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return onfulfilled
        ? onfulfilled({ data: data as any, error: null })
        : (data as any);
    } catch (error) {
      return onrejected ? onrejected(error) : ({ data: null, error } as any);
    } finally {
      client.release();
    }
  }
}

// Singleton instance
let supabaseAdmin: PostgresClient | null = null;

export function getSupabaseAdmin(): PostgresClient {
  if (!supabaseAdmin) {
    supabaseAdmin = new PostgresClient(getPool());
  }
  return supabaseAdmin;
}

export function getSupabaseClient(): PostgresClient {
  if (!supabaseAdmin) {
    supabaseAdmin = new PostgresClient(getPool());
  }
  return supabaseAdmin;
}
