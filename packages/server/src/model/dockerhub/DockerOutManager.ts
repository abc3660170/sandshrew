import { FetchRepoTags, FetchRepo, IDockerManager, Platform } from "@sandshrew/types";
import DockerBaseManager from "./DockerBaseManager.ts";
import axios from "axios";
import { getDockerHubToken } from "../..//utils/utils.ts";
import { dockerTmp } from "../../config/config.ts";
import { FastifyInstance } from "fastify";
// const DOCKERHUB_API_URL = "https://hub.docker.com";
// const REGISTRY_API_URL = "https://registry-1.docker.io";

export default class DockerOutManager
    extends DockerBaseManager
    implements IDockerManager
{
    registerAPI: string;
    tmp: string;

    constructor(options: {
        uplink:  {
            url: string;
            imageUrl: string;
        };
        registerAPI: string;
        tmp: string;
    }, fastify: FastifyInstance) {
        super({
            uplink: options.uplink,
            tmp: options.tmp
        }, fastify);
        this.registerAPI = options.registerAPI;
    }
    async getSuggestions(keyword: string) {
        const response = await axios.get<FetchRepo>(
            `${this.uplink.url}/api/search/v4?from=0&size=10&query=${keyword}`
        );
        return response.data.results;
    }
    async getPackageDocument(id: string, tag: string) {
        const response = await axios.get<FetchRepoTags>(
            `${this.uplink.url}/v2/repositories/${encodeURIComponent(
                id
            )}/tags?name=${encodeURIComponent(
                tag
            )}&ordering=last_updated&page=1&page_size=999999`
        );
        const targetRepo = response.data.results.find(
            // 精确搜索
            (versionRepo) => versionRepo.name === tag
        ) ?? null;
        return targetRepo;
    }

    async getImageDocument(id: string, tag: string, platform: Platform) {
        const os = platform.split("/")[0];
        const architecture = platform.split("/")[1];
        const response = await axios.get<FetchRepoTags>(
            `${this.uplink.url}/v2/repositories/${encodeURIComponent(
                id
            )}/tags?name=${encodeURIComponent(
                tag
            )}&ordering=last_updated&page=1&page_size=999999`
        );
        const targetRepo = response.data.results.find(
            // 精确搜索
            (versionRepo) => versionRepo.name === tag
        );
        if (!targetRepo) return null;
        const targetImage = targetRepo.images.find(
            (image) => image.architecture === architecture && image.os === os
        );
        if (!targetImage) return null;
        return targetImage;
    }

    async getVersions(repoName: string, operate: string) {
        const name = encodeURIComponent(repoName);
        const token = await getDockerHubToken(name, operate);
        const res = await axios.get<{
            name: string;
            tags: string[];
        }>(`${this.registerAPI}/v2/${name}/tags/list`, {
            headers: {
                Authorization: `Bearer ${token.token}`,
                ContentType: "x-www-form-urlencoded",
            },
        });
        return res.data;
    }

    pull(
        repoName: string,
        tag: string,
        platform: Platform
    ) {
        return super._pull(repoName, tag, platform, {            
            getPackageDocument: this.getImageDocument.bind(this),
        });
    }

    downloadTar(
        repos: { id: string; tag: string; platform: Platform }[]) {
        return super._downloadTar(repos, this.tmp, {
            pull: this.pull.bind(this),
        });
    }
}
