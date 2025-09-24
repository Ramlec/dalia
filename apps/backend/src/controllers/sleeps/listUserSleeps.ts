import { FastifyRequest, FastifyReply } from 'fastify'
import { dbAll, openDatabase } from '../../db.js'

export default async function listUserSleeps(req: FastifyRequest, res: FastifyReply) {
  const { userId } = req.params as { userId: string }
  const { dateFrom, dateTo, page = '1', pageSize = '20', sort = 'desc' } = req.query as Record<string, string>

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const offset = (pageNum - 1) * sizeNum
  const sortDir = sort?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  const db = openDatabase()
  try {
    const filters: string[] = []
    const params: any[] = [userId]

    if (dateFrom) {
      filters.push('(datetime(bedtime_full) >= datetime(?))')
      params.push(dateFrom)
    }
    if (dateTo) {
      filters.push('(datetime(bedtime_full) <= datetime(?))')
      params.push(dateTo)
    }

    const where = filters.length ? `AND ${filters.join(' AND ')}` : ''

    const rows = await dbAll<any>(
      db,
      `SELECT s.*
       FROM sleeps s
       WHERE s.user_id = ? ${where}
       ORDER BY datetime(s.bedtime_full) ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, sizeNum, offset]
    )

    return res.send({
      data: rows,
      pagination: { page: pageNum, pageSize: sizeNum }
    })
  } catch (err) {
    req.log.error(err)
    return res.code(500).send({ message: 'Internal Server Error' })
  } finally {
    db.close()
  }
}
