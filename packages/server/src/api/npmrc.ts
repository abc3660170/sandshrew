import { FastifyInstance } from "fastify";
import { getEnvs } from "../utils/utils.ts";
export default async (
  fastify: FastifyInstance,
  options: { routePrefix: string }
) => {
    // [get] /npmjs/
  fastify.get(
    `${options.routePrefix}/`,
    {
      schema: {
        params: {
          type: "object",
          properties: {
            keyword: { type: "string" },
          },
        },
      },
    },
    async (_, reply) => {
      try {
        const config = getEnvs(fastify, 'pull').map(item => {
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