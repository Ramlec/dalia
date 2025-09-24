import { promises as fs } from 'fs'
import path from 'path'
import Database from 'sqlite3'

interface TransformedSleepEntry {
  date: string
  duration: string | null
  duration_min: number | null
  mean_hr: number | null
  bedtime: string | null
  waketime: string | null
  score: number | null
  bedtime_full: string | null
  waketime_full: string | null
}

interface TransformedData {
  user: { firstname: string; lastname: string }
  sleeps: TransformedSleepEntry[]
}

async function readTransformedData(): Promise<TransformedData> {
  const transformedPath = path.resolve(process.cwd(), 'tmp/transformed.json')
  const raw = await fs.readFile(transformedPath, 'utf-8')
  return JSON.parse(raw)
}

async function createTables(db: Database.Database): Promise<void> {
  const sqlPath = path.resolve(process.cwd(), 'sql/create_tables.sql')
  const sql = await fs.readFile(sqlPath, 'utf-8')
  
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function insertUser(db: Database.Database, user: { firstname: string; lastname: string }): Promise<number> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO users (firstname, lastname) VALUES (?, ?)')
    stmt.run([user.firstname, user.lastname], function(err) {
      if (err) reject(err)
      else resolve(this.lastID)
    })
    stmt.finalize()
  })
}

async function insertSleep(db: Database.Database, userId: number, sleep: TransformedSleepEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO sleeps (
        user_id, date, duration, duration_min, mean_hr, 
        bedtime, waketime, score, bedtime_full, waketime_full
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run([
      userId,
      sleep.date,
      sleep.duration,
      sleep.duration_min,
      sleep.mean_hr,
      sleep.bedtime,
      sleep.waketime,
      sleep.score,
      sleep.bedtime_full,
      sleep.waketime_full
    ], function(err) {
      if (err) reject(err)
      else resolve()
    })
    stmt.finalize()
  })
}

async function main(): Promise<void> {
  const dbPath = path.resolve(process.cwd(), 'data/app.db')
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath)
  await fs.mkdir(dataDir, { recursive: true })
  
  const db = new Database.Database(dbPath)
  
  try {
    console.log('Création des tables...')
    await createTables(db)
    
    console.log('Lecture des données transformées...')
    const data = await readTransformedData()
    
    console.log('Insertion de l\'utilisateur...')
    const userId = await insertUser(db, data.user)
    console.log(`Utilisateur créé avec l'ID: ${userId}`)
    
    console.log('Insertion des données de sommeil...')
    let inserted = 0
    for (const sleep of data.sleeps) {
      await insertSleep(db, userId, sleep)
      inserted++
      if (inserted % 100 === 0) {
        console.log(`${inserted} enregistrements insérés...`)
      }
    }
    
    console.log(`Insertion terminée: ${inserted} enregistrements de sommeil insérés`)
    
  } catch (err) {
    console.error('Erreur lors de l\'insertion:', err)
    throw err
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
