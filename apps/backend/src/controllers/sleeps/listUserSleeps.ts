import { FastifyReply, FastifyRequest } from 'fastify'
import { openDatabase, dbAll, dbGet } from '../../db'

export async function listUserSleeps(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: number }
  const query = req.query as {
    page: number
    limit: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
    minScore?: number
    maxScore?: number
    dateFrom?: string
    dateTo?: string
  }
  
  const db = openDatabase()

  const user = await dbGet(db, 'SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
  if (!user) return reply.code(404).send({ error: 'User not found' })

  // Construction de la requête avec filtres
  let whereClause = 'WHERE user_id = ?'
  const params: any[] = [userId]

  if (query.minScore !== undefined) {
    whereClause += ' AND score >= ?'
    params.push(query.minScore)
  }
  if (query.maxScore !== undefined) {
    whereClause += ' AND score <= ?'
    params.push(query.maxScore)
  }
  if (query.dateFrom) {
    whereClause += ' AND date >= ?'
    params.push(query.dateFrom)
  }
  if (query.dateTo) {
    whereClause += ' AND date <= ?'
    params.push(query.dateTo)
  }

  // Tri
  const orderBy = `ORDER BY ${query.sortBy} ${query.sortOrder.toUpperCase()}`

  // Pagination
  const offset = (query.page - 1) * query.limit
  const limitClause = `LIMIT ${query.limit} OFFSET ${offset}`

  const rows = await dbAll(
    db,
    `SELECT id, user_id, date, duration, duration_min, mean_hr, bedtime, waketime, score, bedtime_full, waketime_full
     FROM sleeps
     ${whereClause}
     ${orderBy}
     ${limitClause}`,
    params
  )
  
  return {
    data: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: rows.length
    }
  }
}
