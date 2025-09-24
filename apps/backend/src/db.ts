import path from 'path'
import fs from 'fs'
import sqlite3 from 'sqlite3'

sqlite3.verbose()

export type DatabaseHandle = sqlite3.Database

export function openDatabase(): DatabaseHandle {
  const dbPath = path.resolve(process.cwd(), 'data/app.db')
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const db = new sqlite3.Database(dbPath)
  return db
}

export function dbAll<T = unknown>(db: DatabaseHandle, sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows as T[])
    })
  })
}

export function dbGet<T = unknown>(db: DatabaseHandle, sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row as T | undefined)
    })
  })
}

export function dbRun(db: DatabaseHandle, sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}
