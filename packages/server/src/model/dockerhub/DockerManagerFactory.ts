import { DockerhubOptions, HarborOptions, IDockerManager } from "@sandshrew/types";
import DockerInnerManager from "./DockerInnerManager.ts";
import DockerOutManager from "./DockerOutManager.ts";
import { FastifyInstance } from "fastify";

export default class DockerManagerFactory {
    static create(
        type: "dockerhub" | "harbor",
        options: unknown,
        fastify: FastifyInstance,
    ): IDockerManager {
        if (type === "dockerhub") {
            return new DockerOutManager(options as DockerhubOptions, fastify);
        } else if (type === "harbor") {
            return new DockerInnerManager(options as HarborOptions, fastify);
        } else {
            throw new Error("Invalid DockerManager type");
        }
    }
}