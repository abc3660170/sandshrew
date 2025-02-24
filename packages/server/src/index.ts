import Fastify from "fastify";
import cors from "@fastify/cors";
import npmrcRoute  from "./api/npmrc.ts";
import npmjsRoute  from "./api/npmjs.ts";
import pushRoute  from "./api/push.ts";
import envRoute  from "./api/env.ts";
import { UnknowRegistryConfig } from "./types/index";
import { join } from "path";
import { fileURLToPath } from "url";

const fastify = Fastify({
  requestTimeout: 0,
  keepAliveTimeout: 0,
  connectionTimeout: 0,
  bodyLimit: 1024 * 1024 * 1024 * 1024,
  disableRequestLogging: true,
  logger: {
    level: "debug",
    transport: {
      target: "pino-pretty", // 使用 pino-pretty 格式化输出
      options: {
        colorize: true, // 彩色输出
        translateTime: true, // 显示时间
        ignore: "pid,hostname,reqId", // 忽略特定字段
      },
    },
  },
});

// fastify.get('/', async (_, reply) => {
//   reply.header('Access-Control-Allow-Origin', '*');
//   reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   reply.header('Access-Control-Allow-Headers', 'Content-Type');
//   return { hello: 'world' };
// });

await fastify.register(cors);
fastify.register(import('@fastify/multipart'), { attachFieldsToBody: 'keyValues' });

await fastify.register(import("@fastify/compress"), { global: true, encodings: ['gzip', 'deflate'] });

fastify.register(import("@fastify/static"), {
  root: join(fileURLToPath(import.meta.url), '../www'),
  prefix: '/', // optional: default '/'
})

export const start = async (options: UnknowRegistryConfig, mirrorConfig: Record<string, string>) => {
  fastify.decorate('REGISTER_CONFIG', options as any);
  fastify.decorate('MIRROR_CONFIG', mirrorConfig as any);
  fastify.globalState = {
    npmDownloading: false,
    npmUploding: false,
    localNpm: undefined
  }
  const { app } = options;
  npmjsRoute(fastify, { routePrefix: '/npmjs' })
  npmrcRoute(fastify, { routePrefix: '/npmrc' })
  pushRoute(fastify, { routePrefix: '/push' })
  envRoute(fastify, { routePrefix: '/env' })
  return new Promise<string>((resolve, reject) => {
    fastify.listen(
      { port: app.port, host: "0.0.0.0" },
      (error, address) => {
        if (error) return reject(error);
        fastify.log.info("@sandshrew/server start success !");
        resolve(address);
      }
    );
  });
};

export const shutdown = async () => {
  try {
    await fastify.close();
  } catch (error) {
    fastify.log.fatal("@sandshrew/server shutdown fail !");
  }
};
