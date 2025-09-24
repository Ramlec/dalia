import { FastifyReply, FastifyRequest } from 'fastify'
import { openDatabase, dbGet } from '../../db'

export async function getUserSleep(req: FastifyRequest, reply: FastifyReply) {
  const { userId, sleepId } = req.params as { userId: number; sleepId: number }
  const db = openDatabase()

  const row = await dbGet(
    db,
    `SELECT id, user_id, date, duration, duration_min, mean_hr, bedtime, waketime, score, bedtime_full, waketime_full
     FROM sleeps
     WHERE user_id = ? AND id = ?
     LIMIT 1`,
    [userId, sleepId]
  )
  if (!row) return reply.code(404).send({ error: 'Sleep not found' })
  return row
}
