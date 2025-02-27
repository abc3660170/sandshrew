import { FastifyInstance } from "fastify";
import { getSuggestions, getPackageDocument } from "../model/base.js";
import { extractVersion, getPackageReadme, isBusy, xx } from "../utils/utils.js";
import distill from "../model/distill.js";
import { readFile, readFileSync } from "fs";
import type { PackageJSON, Packument } from "@npm/types";
import { resolve } from "path";

export default async (
  fastify: FastifyInstance,
  options: { routePrefix: string }
) => {
  // [get] /npmjs/suggestions?q=xxx
  fastify.get<{
    Querystring: {
      q: string;
    };
  }>(
    `${options.routePrefix}/suggestions`,
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
    async (request, reply) => {
      const { q } = request.query;
      try {
        const doc = await getSuggestions(q, fastify);
        return reply.send(doc);
      } catch (error) {
        return reply.status(500).send({
          error,
        });
      }
    }
  );

  // [get] /npmjs/package/:name/document
  fastify.get<{
    Params: {
      name: string;
    };
  }>(
    `${options.routePrefix}/package/:name/document`,
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
    async (request, reply) => {
      const { name } = request.params;
      try {
        return reply.send(await getPackageDocument(name, fastify));
      } catch (error) {
        return reply.status(500).send({
          error,
        });
      }
    }
  );

  // [post] /npmjs/download
  fastify.post<{
    Body: string[];
  }>(`${options.routePrefix}/download`, async (request, reply) => {
    // todo 撤销下载
    const pkgs = request.body;
    if (isBusy(fastify)) {
      return reply.status(500).send({
        message: "有人在用你先等等还行啊！",
      });
    } else {
      fastify.globalState.npmDownloading = true;
      try {
        const zipFile = await distill(fastify, pkgs);
        const data = readFileSync(zipFile);
        reply.header("Content-Type", "application/octet-stream");
        reply.header("content-length", data.byteLength);
        fastify.globalState.npmDownloading = false;
        return reply.send(data);
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({
          code: error.name,
          message: error.message,
        });
        fastify.globalState.npmDownloading = false;
        return reply;
      }
    }
  });

  // [post] /npmjs/resolvePkg
  fastify.post<{
    Body: {
      file: ArrayBuffer;
    };
  }>(`${options.routePrefix}/resolvePkg`, async (request, reply) => {
    let result: any[] = [];
    const data = request.body.file;
    const decoder = new TextDecoder("utf-8");
    try {
      const pkg: PackageJSON = JSON.parse(decoder.decode(data));
      const dependencies = pkg.dependencies;
      const devDependencies = pkg.devDependencies;
      const mergeDeps = Object.assign({}, dependencies, devDependencies);
      const promises: Promise<null | [string, string]>[] = [];
      for (const name in mergeDeps) {
        if (Object.hasOwnProperty.call(mergeDeps, name)) {
          promises.push(extractVersion(fastify, name, mergeDeps[name]!));
        }
      }
      const versions = await Promise.allSettled(promises);
      // console.log(versions);
      result = versions
        .map((d) => {
          if(d.status === 'fulfilled') {
            if(!!d.value) {
               return `${d.value![0]}@${d.value![1]}`
            }
          }
          return null
        }).filter( i => !!i);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send(error)
    }
  });

  // [get] /npmjs/:name/:version/readme
  fastify.get<{
    Params: {
      name: string;
      version: string;
    };
  }>(
    `${options.routePrefix}/:name/:version/readme`,
    {
      schema: {
        params: {
          type: "object",
          properties: {
            name: { type: "string" },
            version: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, version } = request.params;
      try {
        const doc = await getPackageReadme(fastify, name, version);
        return reply.send(doc);
      } catch (error) {
        return reply.status(500).send({
          error,
        });
      }
    }
  );

  fastify.get<{
    Params: {
      name: string;
      version: string;
    };
  }>(
    `${options.routePrefix}/test/vue/3.5.13/readme`,
    {
      schema: {
        params: {
          type: "object",
          properties: {
            name: { type: "string" },
            version: { type: "string" },
          },
        },
      },
    },
    async (_, reply) => {
       const pkg = resolve(process.cwd(), "./src/test/vue/3.5.13.tgz");
       try {
        const doc = await xx(pkg);
        return reply.send(doc);
      } catch (error) {
        return reply.status(500).send({
          error,
        });
      }
    }
  );
};
