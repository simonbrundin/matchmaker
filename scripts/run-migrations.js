import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = './migrations'

function runMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`Found ${files.length} migration files\n`)

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    
    console.log(`========================================`)
    console.log(`MIGRATION: ${file}`)
    console.log(`========================================`)
    console.log(sql)
    console.log(`\nCopy and run the above SQL in Supabase SQL Editor.\n`)
  }
}

runMigrations()