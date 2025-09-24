import { FastifyInstance } from 'fastify'
import listUsers from '../controllers/users/listUsers.js'
import getUser from '../controllers/users/getUser.js'
import listUserSleeps from '../controllers/sleeps/listUserSleeps.js'
import getUserSleep from '../controllers/sleeps/getUserSleep.js'
import { userIdParamsSchema, sleepIdParamsSchema, sleepQuerySchema } from '../schemas/validation.js'
import { validate } from '../middleware/validation.js'

export default async function usersRoutes(app: FastifyInstance) {
  app.get('/users', {}, listUsers)
  app.get('/users/:userId', { preHandler: validate({ params: userIdParamsSchema }) }, getUser)
  app.get('/users/:userId/sleeps', { preHandler: validate({ params: userIdParamsSchema, query: sleepQuerySchema }) }, listUserSleeps)
  app.get('/users/:userId/sleeps/:sleepId', { preHandler: validate({ params: sleepIdParamsSchema }) }, getUserSleep)
}
