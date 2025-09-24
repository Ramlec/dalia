import { FastifyRequest, FastifyReply } from 'fastify'
import { dbAll, openDatabase } from '../../db.js'

export default async function listUsers(_req: FastifyRequest, res: FastifyReply) {
  const db = openDatabase()
  try {
    const users = await dbAll<any>(db, `SELECT id, firstname, lastname FROM users ORDER BY lastname, firstname`)
    return res.send(users)
  } catch (err) {
    res.log.error(err)
    return res.code(500).send({ message: 'Internal Server Error' })
  } finally {
    db.close()
  }
}
