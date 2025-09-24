import { FastifyRequest, FastifyReply } from 'fastify'
import { dbGet, openDatabase } from '../../db.js'

export default async function getUser(req: FastifyRequest, res: FastifyReply) {
  const { userId } = req.params as { userId: string }
  const db = openDatabase()
  try {
    const user = await dbGet<any>(db, `SELECT * FROM users WHERE id = ?`, [userId])
    if (!user) {
      return res.code(404).send({ message: 'User not found' })
    }
    return res.send(user)
  } catch (err) {
    req.log.error(err)
    return res.code(500).send({ message: 'Internal Server Error' })
  } finally {
    db.close()
  }
}
