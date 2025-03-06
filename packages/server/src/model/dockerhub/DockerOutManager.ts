import { FetchRepoTags, FetchRepo, IDockerManager, Platform } from "src/types";
import DockerBaseManager from "./DockerBaseManager";
import axios from "axios";
import { getDockerHubToken } from "../..//utils/utils";

const DOCKERHUB_API_URL = "https://hub.docker.com";
const REGISTRY_API_URL = "https://registry-1.docker.io";

export default class DockerOutManager extends DockerBaseManager implements IDockerManager{
    async getSuggestions(keyword: string) {
        const response = await axios.get<FetchRepo>(
          `${DOCKERHUB_API_URL}/api/search/v4?from=0&size=4&query=${keyword}`
        );
        return response.data.results;
    };
    async getPackageDocument(id: string, tag: string, platform: Platform) {
        const os = platform.split("/")[0];
        const architecture = platform.split("/")[1];
        const response = await axios.get<FetchRepoTags>(
            `${DOCKERHUB_API_URL}/v2/repositories/${encodeURIComponent(
                id
            )}/tags?name=${encodeURIComponent(
            tag
            )}&ordering=last_updated&page=1&page_size=999999`
        );
        const targetRepo = response.data.results.find(
            (versionRepo) => versionRepo.name === tag
        );
        if (!targetRepo) return null;
        const targetImage = targetRepo.images.find(
            (image) => image.architecture === architecture && image.os === os
        );
        if (!targetImage) return null;
        return targetImage;
    }

    async getVersions (repoName: string, operate: string) {
        const name = encodeURIComponent(repoName);
        const token = await getDockerHubToken(name, operate);
        const res = await axios.get<{
          name: string;
          tags: string[];
        }>(`${REGISTRY_API_URL}/v2/${name}/tags/list`, {
          headers: {
            Authorization: `Bearer ${token.token}`,
          },
        });
        return res.data;
    };
}