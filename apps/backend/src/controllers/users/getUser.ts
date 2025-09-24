import { FastifyReply, FastifyRequest } from 'fastify'
import { openDatabase, dbGet } from '../../db'

export async function getUser(req: FastifyRequest, reply: FastifyReply) {
  const { userId } = req.params as { userId: number }
  const db = openDatabase()
  const user = await dbGet<{ id: number; firstname: string; lastname: string }>(
    db,
    'SELECT id, firstname, lastname FROM users WHERE id = ? LIMIT 1',
    [userId]
  )
  if (!user) return reply.code(404).send({ error: 'User not found' })
  return user
}
