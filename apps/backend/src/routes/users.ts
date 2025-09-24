import { FastifyInstance } from 'fastify'
import { listUsers } from '../controllers/users/listUsers'
import { getUser } from '../controllers/users/getUser'
import { listUserSleeps } from '../controllers/sleeps/listUserSleeps'
import { getUserSleep } from '../controllers/sleeps/getUserSleep'
import { userIdParamsSchema, sleepIdParamsSchema, sleepQuerySchema } from '../schemas/validation'
import { validateParams, validateQuery } from '../middleware/validation'

export default async function usersRoutes(app: FastifyInstance) {
  app.get('/users', listUsers)
  
  app.get('/users/:userId', {
    preHandler: validateParams(userIdParamsSchema)
  }, getUser)
  
  app.get('/users/:userId/sleeps', {
    preHandler: [
      validateParams(userIdParamsSchema),
      validateQuery(sleepQuerySchema)
    ]
  }, listUserSleeps)
  
  app.get('/users/:userId/sleeps/:sleepId', {
    preHandler: validateParams(sleepIdParamsSchema)
  }, getUserSleep)
}
