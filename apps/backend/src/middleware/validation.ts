import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodSchema, ZodError } from 'zod'

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.params)


      request.params = validated as any
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      throw error
    }
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.query)
      request.query = validated as any
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      throw error
    }
  }
}

export function validate(opts: { params?: ZodSchema<any>; query?: ZodSchema<any> }) {
  const handlers = [] as Array<(req: FastifyRequest, reply: FastifyReply) => Promise<any>>
  if (opts.params) handlers.push(validateParams(opts.params))
  if (opts.query) handlers.push(validateQuery(opts.query))
  return async (req: FastifyRequest, reply: FastifyReply) => {
    for (const h of handlers) {
      const res = await h(req, reply)
      if (res) return res
    }
  }
}
