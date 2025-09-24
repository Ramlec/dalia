import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodSchema, ZodError } from 'zod'

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.params)
      request.params = validated
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
      request.query = validated
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
