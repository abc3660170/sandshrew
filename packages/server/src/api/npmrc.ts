import { FastifyInstance } from "fastify";
import { getEnvs } from "../utils/utils.ts";
export default async (
  fastify: FastifyInstance,
  options: { routePrefix: string }
) => {
    // [get] /npmrc
  fastify.get(
    `${options.routePrefix}`,
    async (_, reply) => {
      try {
        const config = getEnvs(fastify, 'push').map(item => {
            // 去掉配置项前面的 -- 
            const matcher = /-*(.+)/.exec(item);
            return matcher![1]
        })
        return reply.send(config)
      } catch (error) {
        return reply.status(500).send({
          error,
        });
      }
    }
  );
}