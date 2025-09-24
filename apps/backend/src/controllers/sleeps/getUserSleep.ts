import { FastifyRequest, FastifyReply } from 'fastify'
import { dbGet, openDatabase } from '../../db.js'

export default async function getUserSleep(req: FastifyRequest, res: FastifyReply) {
  const { userId, sleepId } = req.params as { userId: string; sleepId: string }
  const db = openDatabase()
  try {
    const sleep = await dbGet<any>(
      db,
      `SELECT s.* FROM sleeps s WHERE s.id = ? AND s.user_id = ?`,
      [sleepId, userId]
    )
    if (!sleep) {
      return res.code(404).send({ message: 'Sleep not found' })
    }
    return res.send(sleep)
  } catch (err) {
    req.log.error(err)
    return res.code(500).send({ message: 'Internal Server Error' })
  } finally {
    db.close()
  }
}
