import { FastifyReply, FastifyRequest } from 'fastify'
import { openDatabase, dbAll } from '../../db'

export async function listUsers(_req: FastifyRequest, _reply: FastifyReply) {
  const db = openDatabase()
  const users = await dbAll<{ id: number; firstname: string; lastname: string }>(
    db,
    'SELECT id, firstname, lastname FROM users ORDER BY id ASC'
  )
  return users
}
