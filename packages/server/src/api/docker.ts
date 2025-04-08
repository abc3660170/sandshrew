import { FastifyInstance } from "fastify";
import DockerManagerFactory from "../model/dockerhub/DockerManagerFactory.ts";
import { isBusy } from "../utils/utils.ts";
import { Platform } from "@sandshrew/types";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream, mkdirSync, statSync } from "fs";
import { sync } from "rimraf";
import { uploadTar } from "src/model/dockerhub/hub.ts";

export default async (
    fastify: FastifyInstance,
    options: { routePrefix: string }
) => {
    const managerOptions = fastify.SANDSHREW_CONFIG.docker;
    const manager = DockerManagerFactory.create(
        managerOptions.mode,
        managerOptions.options,
        fastify
    );
    // [get] /docker/getSuggestions
    fastify.get<{
        Querystring: {
            q: string;
        };
    }>(`${options.routePrefix}/suggestions`, async (req, reply) => {
        try {
            const result = await manager.getSuggestions(req.query.q);
            return reply.status(200).send(result);
        } catch (error) {
            return reply.status(500).send({
                error,
            });
        }
    });

    // [get] /docker/package/:name/versions
    fastify.get<{
        Params: {
            name: string;
        };
    }>(
        `${options.routePrefix}/package/:name/versions`,
        async (request, reply) => {
            const { name } = request.params;
            try {
                return reply.send(await manager.getVersions(name, "pull"));
            } catch (error) {
                return reply.status(500).send({
                    error,
                });
            }
        }
    );

    // [get] /docker/package/:name/:tag/document
    fastify.get<{
        Params: {
            name: string;
            tag: string;
        };
    }>(
        `${options.routePrefix}/package/:name/:tag/document`,
        async (request, reply) => {
            const { name, tag } = request.params;
            try {
                return reply.send(await manager.getPackageDocument(name, tag));
            } catch (error) {
                return reply.status(500).send({
                    error,
                });
            }
        }
    );

    // [post] /npmjs/download
    fastify.post<{
        Body: {
            id: string;
            tag: string;
            platform: Platform;
        }[];
    }>(`${options.routePrefix}/download`, async (request, reply) => {
        // todo 撤销下载
        if (isBusy(fastify)) {
            return reply.status(500).send({
                message: "有人在用你先等等还行啊！",
            });
        } else {
            try {
                fastify.globalState.npmDownloading = true;
                const file = await manager.downloadTar(request.body);
                fastify.log.info(`文件路径: ${file}`);
                const stat = statSync(file);
                reply.header("Content-Length", stat.size);
                reply.type("application/gzip");
                reply.header(
                    "Content-Disposition",
                    'attachment; filename="images.tar.gz"'
                );
                const fileStream = createReadStream(file);
                fastify.globalState.npmDownloading = false;
                return reply.send(fileStream);
            } catch (err) {
                fastify.log.error(err);
                fastify.globalState.npmDownloading = false;
                return reply.status(500).send({
                    code: err.name,
                    message: err.message,
                });
            }
        }
    });

    fastify.post(`${options.routePrefix}/upload`, async (req, reply) => {
        if (isBusy(fastify)) {
            return reply
                .status(226)
                .send({ errors: ["有人在用，你先等等还行啊！"] });
        } else {
            const data = await req.file(); // 获取单个文件
            if (!data) {
                return reply.status(400).send({ error: "没有文件上传" });
            }
            fastify.globalState.npmUploding = true;

            const ws = manager.getUploadDir();
            mkdirSync(ws, { recursive: true });
            const filePath = `${ws}/upload.tar.gz`;
            fastify.log.info(`生成的文件路径: ${filePath}`);
            sync(filePath);
            const writeStream = createWriteStream(filePath);

            try {
                // 使用 pump 将文件流写入磁盘
                await pipeline(data.file, writeStream);
                await manager.uploadTar(filePath);
                reply.send({
                    message: "File uploaded successfully",
                    filename: data.filename,
                    code: 200,
                });
            } catch (err) {
                reply
                    .status(500)
                    .send({ error: "Upload failed", details: err.message });
            } finally {
                fastify.globalState.npmUploding = false;
                // 关闭文件流
                writeStream.end();
            }
        }
    });
};
