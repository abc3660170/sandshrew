import { FastifyInstance } from "fastify";
import { RepoMetaData } from "src/types";
import { $ } from "zx";

export default abstract class DockerBaseManager {
    fastify: FastifyInstance;
    password: string;
    harbor: string;
    async save(imageId: string, output: string) {
        await $`docker save -o ${output} ${imageId}`;
        return output;
    }

    async push(repo: RepoMetaData) {
        const harborURL = this.harbor;
        await $`echo ${this.password} | docker login ${harborURL} -u admin --password-stdin`;
        await $`docker tag ${repo.imageId} ${harborURL}/${repo.id}:${repo.tag}`;
        await $`docker push ${harborURL}/${repo.id}:${repo.tag}`;
        this.fastify.log.info(`镜像${harborURL}/${repo.id}:${repo.tag}已成功上传！`)
    }
}
