import Fastify from 'fastify'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import usersRoutes from './routes/users'

const server = Fastify({ logger: true })

await server.register(cors, { origin: true })
await server.register(compress)
await server.register(usersRoutes)

server.get('/health', async () => ({ status: 'ok' }))

const port = Number(process.env.PORT || 3000)
try {
  await server.listen({ port, host: '0.0.0.0' })
  server.log.info(`Server running on http://0.0.0.0:${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
