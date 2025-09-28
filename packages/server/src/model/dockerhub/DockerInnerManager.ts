import { DockerHubAPIVersion, DockerImageInfo, HarborTagInfo, IDockerManager, Platform } from "@sandshrew/types";
import DockerBaseManager from "./DockerBaseManager.ts";
import axios from "axios";
import { dockerTmp } from "../../config/config.ts";
import { FastifyInstance } from "fastify";
// const DOCKERHUB_API_URL = "http://10.0.254.1";
// const HARBOR_USER = "admin";
// const HARBOR_PASSWORD = "Njhf@1212";

export default class DockerInnerManager
    extends DockerBaseManager
    implements IDockerManager
{
    tmp: string;

    constructor(options: {
        uplink: {
            url: string;
            username: string;
            password: string;
            imageUrl: string;
        };
        harbor: {
            url: string;
            username: string;
            password: string;
            imageUrl: string;
        }
        tmp: string;
    }, fastify: FastifyInstance) {
        super(options, fastify);
        this.tmp = `${options.tmp}/${dockerTmp}`;
    }

    async getImageDocument(id: string, tag: string, platform: Platform): Promise<DockerImageInfo | null> {
        const doc = await this.getPackageDocument(id, tag);
        const image = doc?.images.find(image => `${image.os}/${image.architecture}` === platform);
        if(!image) return null;
        return {
            architecture: image.architecture,
            os: image.os,
            os_version: null,
            digest: image.digest,
            size: image.size,
            last_pulled: image.last_pulled,
            last_pushed: image.last_pushed,
            variant: image.variant,
            status: "active",
        };
    }
    
    async getPackageDocument(id: string, tag: string): Promise< DockerHubAPIVersion  | null> {
        const [scope, name] = id.split("/");
        const response = await axios.get<HarborTagInfo>(
            `${this.uplink.url}/api/v2.0/projects/${scope}/repositories/${name}/artifacts/${tag}`
        );
        const tagInfo = response.data;
        const references = tagInfo.references;
        const targetRepo = references ? references.map(d => { return {
            architecture: d.platform.architecture,
            os: d.platform.os,
            os_version: null,
            digest: d.child_digest,
            variant: d.platform.variant,
            status: "active" as "active",
            last_pulled: tagInfo.tags.pull_time,
            last_pushed: tagInfo.tags.push_time,
            size: tagInfo.size,
        }}) : [{...tagInfo.extra_attrs!, digest: tagInfo.digest}]
        return {
            name: tag,
            digest: tagInfo.digest,
            content_type: "image",
            id: tagInfo.id,
            full_size: tagInfo.size,
            repository: 0,
            tag_status: "active" as "active",
            images: targetRepo
        }
    }

    async getVersions (id: string) {
        const [scope, name] = id.split("/");
        const res = await axios.get<{
            digest: string;
            tags: any[];
            pull_time: string;
            push_time: string;
        }[]>(`${this.uplink.url}/api/v2.0/projects/${scope}/repositories/${name}/artifacts`, {
          headers: {
            username: this.uplink.username,
            password: this.uplink.password,
          },
        });
        return {
            name: id,
            tags: res.data.map((item) => item.tags.map(d => d.name)).flat(),
        }
    };

    async getSuggestions(keyword: string) {
        const response = await axios.get<{
            repository: {
                artifact_count: number;
                project_id: number;
                project_name: string;
                project_public: boolean;
                repository_name: string;
                pull_count?: number;
            }[]
        }>(
            `${this.uplink.url}/api/v2.0/search?q=${keyword}`
          );
          const result =  response.data;
          return result.repository.map((item) => {
              return {
                  id: item.repository_name,
                  name: item.repository_name,
                  description: item.project_name,
                  pull_count: String(item.pull_count) ?? '0',
                  star_count: item.artifact_count,
              };
          });
    }

    async pull(repoName: string, tag: string, platform: Platform) {
      return super._pull(repoName, tag, platform, { getPackageDocument: this.getImageDocument.bind(this) });
    }

    downloadTar(
      repos: { id: string; tag: string; platform: Platform }[]
  ) {
      return super._downloadTar(repos, this.tmp, {
          pull: this.pull.bind(this),
      });
  }
}
