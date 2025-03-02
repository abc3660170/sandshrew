import { FastifyInstance } from "fastify";
export default async (
  fastify: FastifyInstance,
  options: { routePrefix: string }
) => {
    // [get] /npmjs/
  fastify.get(
    `${options.routePrefix}/`,
    async (_, reply) => {
      try {
        return reply.send(fastify.REGISTER_CONFIG)
      } catch (error) {
        return reply.status(500).send({
          error,
        });
      }
    }
  );
}