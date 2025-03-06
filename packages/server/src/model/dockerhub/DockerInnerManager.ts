import { DockerImageInfo, HarborTagInfo, IDockerManager, Platform } from "src/types";
import DockerBaseManager from "./DockerBaseManager";
import axios from "axios";

const DOCKERHUB_API_URL = "http://10.0.254.1";
const HARBOR_USER = "admin";
const HARBOR_PASSWORD = "Njhf@1212";

export default class DockerInnerManager
    extends DockerBaseManager
    implements IDockerManager
{
    async getPackageDocument(id: string, tag: string, platform: Platform): Promise<DockerImageInfo | null> {
        const [os, architecture] = platform.split("/");
        const [scope, name] = id;
        const response = await axios.get<HarborTagInfo>(
            `${DOCKERHUB_API_URL}/api/v2.0/projects/${scope}/repositories/${name}/artifacts/${tag}`
        );
        const tagInfo = response.data;
        const targetRepo = tagInfo.references.find(
            (versionRepo) =>
                versionRepo.platform.os === os &&
                versionRepo.platform.architecture === architecture
        );
        // 将targetRepo转换为DockerImageInfo
        if (!targetRepo) {
            throw new Error("No matching repository found for the specified platform.");
        }

        return {
            architecture: targetRepo.platform.architecture,
            os: targetRepo.platform.os,
            os_version: null,
            digest: targetRepo.child_digest,
            size: tagInfo.size,
            last_pulled: tagInfo.tags.pull_time,
            last_pushed: tagInfo.tags.push_time,
            variant: targetRepo.platform.variant,
            status: "active",
        };
    }

    async getVersions (id: string) {
        const [scope, name] = id;
        const res = await axios.get<{
            digest: string;
            tags: string[];
            pull_time: string;
            push_time: string;
        }[]>(`${DOCKERHUB_API_URL}/api/v2.0/projects/${scope}/repositories/${name}/artifacts`, {
          headers: {
            username: HARBOR_USER,
            password: HARBOR_PASSWORD,
          },
        });
        return {
            name: id,
            tags: res.data.map((item) => item.tags).flat(),
        }
    };
}
