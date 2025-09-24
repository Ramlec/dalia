import { promises as fs } from 'fs'
import path from 'path'

interface RawSleepEntry {
  duration: string | null
  mean_hr: number | null
  bedtime: string | null
  waketime: string | null
  score: number | null
}

interface RawData {
  firstname: string
  lastname: string
  sleep: Record<string, RawSleepEntry>
}

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

function toMinutes(duration: string | null): number | null {
  if (!duration) return null
  const numbers = duration.match(/\d+/g)
  if (!numbers || numbers.length === 0) return null

  if (numbers.length >= 2) {
    const hours = parseInt(numbers[0], 10)
    const minutes = parseInt(numbers[1], 10)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
    return hours * 60 + minutes
  }

  const only = parseInt(numbers[0], 10)
  if (Number.isNaN(only)) return null
  const lower = duration.toLowerCase()
  if (lower.includes('h')) {
    return only * 60
  }
  return only
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Parse a date key like "11/05/2025" as DD/MM/YYYY into a Date (UTC midnight)
function parseDateKey(dateKey: string): Date | null {
  const slashMatch = dateKey.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10)
    const month = parseInt(slashMatch[2], 10)
    const year = parseInt(slashMatch[3], 10)
    if (
      Number.isNaN(day) ||
      Number.isNaN(month) ||
      Number.isNaN(year) ||
      day < 1 || day > 31 ||
      month < 1 || month > 12
    ) {
      return null
    }
    // Create UTC date at 00:00:00
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  }
  // Unsupported format for now
  return null
}

// Parse time string like "10:59 PM" or "7:56 AM" to {hour,min,period}
function parseTime12h(timeStr: string): { hour24: number; minute: number; period: 'AM' | 'PM' } | null {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const minute = parseInt(m[2], 10)
  const period = m[3].toUpperCase() as 'AM' | 'PM'
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 1 || hour > 12 ||
    minute < 0 || minute > 59
  ) return null

  // Convert to 24h
  if (period === 'AM') {
    if (hour === 12) hour = 0
  } else {
    if (hour !== 12) hour += 12
  }
  return { hour24: hour, minute, period }
}

function toIsoLocal(dateObj: Date): string {
  // Build ISO-like string without timezone designator: YYYY-MM-DDTHH:MM:ss
  const y = dateObj.getUTCFullYear()
  const m = pad2(dateObj.getUTCMonth() + 1)
  const d = pad2(dateObj.getUTCDate())
  const hh = pad2(dateObj.getUTCHours())
  const mm = pad2(dateObj.getUTCMinutes())
  const ss = pad2(dateObj.getUTCSeconds())
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`
}

function buildFullTimes(
  dateKey: string,
  bedtime: string | null,
  waketime: string | null
): { bedtime_full: string | null; waketime_full: string | null } {
  const baseDate = parseDateKey(dateKey)
  if (!baseDate || !bedtime || !waketime) {
    return { bedtime_full: null, waketime_full: null }
  }

  const bt = parseTime12h(bedtime)
  const wt = parseTime12h(waketime)
  if (!bt || !wt) {
    return { bedtime_full: null, waketime_full: null }
  }

  const bedtimeDate = new Date(baseDate.getTime())
  bedtimeDate.setUTCHours(bt.hour24, bt.minute, 0, 0)

  const waketimeDate = new Date(baseDate.getTime())
  // If bedtime is PM and waketime is AM, waketime is the next day
  if (bt.period === 'PM' && wt.period === 'AM') {
    waketimeDate.setUTCDate(waketimeDate.getUTCDate() + 1)
  }
  waketimeDate.setUTCHours(wt.hour24, wt.minute, 0, 0)

  return { bedtime_full: toIsoLocal(bedtimeDate), waketime_full: toIsoLocal(waketimeDate) }
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

async function main(): Promise<void> {
  const inputPath = path.resolve(process.cwd(), '../../homework_data.json')
  const outDir = path.resolve(process.cwd(), 'tmp')
  const outPath = path.join(outDir, 'transformed.json')

  const raw = await fs.readFile(inputPath, 'utf-8')
  const data: RawData = JSON.parse(raw)

  const sleeps: TransformedSleepEntry[] = Object.entries(data.sleep || {})
    .map(([date, entry]) => {
      const full = buildFullTimes(date, entry.bedtime, entry.waketime)
      return {
        date,
        duration: entry.duration,
        duration_min: toMinutes(entry.duration),
        mean_hr: entry.mean_hr,
        bedtime: entry.bedtime,
        waketime: entry.waketime,
        score: entry.score,
        bedtime_full: full.bedtime_full,
        waketime_full: full.waketime_full,
      }
    })
    // tri par date alphabétique tel quel
    .sort((a, b) => a.date.localeCompare(b.date))

  const transformed: TransformedData = {
    user: { firstname: data.firstname, lastname: data.lastname },
    sleeps,
  }

  await ensureDir(outDir)
  await fs.writeFile(outPath, JSON.stringify(transformed, null, 2), 'utf-8')
  // eslint-disable-next-line no-console
  console.log(`Transformation terminée. Fichier écrit: ${outPath}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
