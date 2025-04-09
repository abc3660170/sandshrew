import { FastifyInstance } from "fastify";
import { sync } from "rimraf";
import {
    HarborOptions,
    IDockerManager,
    Platform,
    RepoMetaData,
    RepoMetaGroup,
} from "@sandshrew/types";
import { join, resolve } from "path";
import { mkdirSync, promises } from "fs";
import { $ } from "zx";
import axios from "axios";
import { dockerTmp } from "../../config/config.ts";

// const HUAFEI_API_URL = "http://10.0.254.1";
export default abstract class DockerBaseManager {
    fastify: FastifyInstance;
    uplink: {
        url: string;
        username?: string;
        password?: string;
        imageUrl: string;
    };
    harbor?: {
        url: string;
        username: string;
        password: string;
        imageUrl: string;
    };
    tmp: string;
    constructor(
        options: {
            uplink: {
                url: string;
                username?: string;
                password?: string;
                imageUrl: string;
            };
            harbor?: {
                url: string;
                username: string;
                password: string;
                imageUrl: string;
            };
            tmp: string;
        },
        fastify: FastifyInstance
    ) {
        this.fastify = fastify;
        this.uplink = options.uplink;
        this.harbor = options.harbor;
        this.tmp = `${options.tmp}/${dockerTmp}`;
    }

    async cleanImage(repo: RepoMetaData) {
        if (!repo.localExsit) {
            await $`docker rmi ${repo.imageId}`;
        }
    }

    async save(imageId: string, output: string) {
        await $`docker save -o ${output} ${imageId}`;
        return output;
    }

    _platformTag(platform: Platform) {
        return platform.replace('/', "_");
    }

    async _getDigest(harbor: HarborOptions["harbor"], id: string, tag: string) {
        // 通过dockerhub的API获取镜像的digest
        const [project, repository] = id.split("/");
        const res = await axios.get(
            `${harbor.url}/api/v2.0/projects/${project}/repositories/${repository}/artifacts/${tag}`,
            {
                auth: {
                    username: harbor.username,
                    password: harbor.password,
                }
            }
        ); 
        return res.data.digest;
    }

    async _pushCurrentImage(
        harbor: HarborOptions["harbor"],
        repo: RepoMetaData
    ) {
        const [project, _] = repo.id.split("/");
        // 判断这个镜像对应的project是否存在，不存在的话先调用harbor的API创建
        try {
            await this._createProject(harbor, project!);
        } catch (error) {
            if(error.status !== 409) {
                throw error
            }
        }
        
        await $`echo ${this.uplink.password} | docker login ${harbor.imageUrl} -u admin --password-stdin`;
        await $`docker tag ${repo.imageId} ${harbor.imageUrl}/${repo.id}:${repo.tag}-${this._platformTag(repo.platform)}`;
        await $`docker push ${harbor.imageUrl}/${repo.id}:${repo.tag}-${this._platformTag(repo.platform)}`;
        // 通过docker images --digests 命令获取镜像的digest，REPOSITORY 是${harbor.imageUrl}/${repo.id} TAG 是${repo.tag}-${this._platformTag(repo.platform)}
        const digestOutput = (
            await $`docker images --digests --format "{{.Repository}} {{.Tag}} {{.Digest}}" | grep "${harbor.imageUrl}/${repo.id}" | grep "${repo.tag}-${this._platformTag(repo.platform)}" | awk '{print $3}'`
        ).stdout.trim();

        if (!digestOutput) {
            throw new Error(
            `无法获取镜像 ${harbor.imageUrl}/${repo.id}:${repo.tag}-${this._platformTag(repo.platform)} 的 digest`
            );
        }

        return digestOutput;
        
    }


    async _deletaTag(harbor: HarborOptions["harbor"], repo: RepoMetaData, digest: string) {
        const [project, repository] = repo.id.split("/");
        await axios.delete(
            `${harbor.url}/api/v2.0/projects/${project}/repositories/${repository}/artifacts/${digest}/tags/${repo.tag}`,
            {
                auth: {
                    username: harbor.username,
                    password: harbor.password,
                }
            }
        );
    }

    async _deleteArtifacts(harbor: HarborOptions["harbor"], repo: RepoMetaData, digest: string) {
        const [project, repository] = repo.id.split("/");
        await axios.delete(
            `${harbor.url}/api/v2.0/projects/${project}/repositories/${repository}/artifacts/${digest}`,
            {
                auth: {
                    username: harbor.username,
                    password: harbor.password,
                }
            }
        );
    }

    async _addTag(harbor: HarborOptions["harbor"], repo: RepoMetaData, digest: string) {
        const [project, repository] = repo.id.split("/");
        await axios.post(
            `${harbor.url}/api/v2.0/projects/${project}/repositories/${repository}/artifacts/${digest}/tags`,
            {
                name: repo.tag
            },
            {
                auth: {
                    username: harbor.username,
                    password: harbor.password,
                }
            }
        );
    }

    async _createProject(harbor: HarborOptions["harbor"], project: string) {
        await axios.post(
            `${harbor.url}/api/v2.0/projects`,
            {
                metadata: {
                    public: "true"
                },
                project_name: project
            },
            {
                auth: {
                    username: harbor.username,
                    password: harbor.password,
                }
            }
        );
    }

    async push(repo: RepoMetaData) {
        const harbor = this.harbor;
        if (harbor === undefined) {
            throw new Error("没有配置harbor的url，无法上传镜像");
        }

        const digest = await this._pushCurrentImage(harbor, repo);

        const [project, repository] = repo.id.split("/");
        // 本地删除 manifest list 不论是否存在
        try {
            await $`docker manifest rm ${repo.id}:${repo.tag}`;
        } catch (error) {
            error
        }
        // 先通过harbor的API判断 repo.tag 是不是已经存在
        try {
            const tagCheckResponse = await axios.get(
                `${harbor.url}/api/v2.0/projects/${project}/repositories/${repository}/artifacts/${repo.tag}`,
                {
                    auth: {
                        username: harbor.username,
                        password: harbor.password
                    }
                }
            );

            // 如果存在，判断是分组还是镜像
            const { references, extra_attrs } = tagCheckResponse.data;
            if (Array.isArray(references)) {
                // 是分组，记录下这个分组下所有的 reference
                const referencesDigest: string[] = references.map(
                    (artifact: any) => artifact.child_digest
                );

                // 删除该分组
                await this._deleteArtifacts(harbor, repo, tagCheckResponse.data.digest);

                // 将记录下的 reference 和新上传的镜像重新 push 到新的分组下
                await $`docker manifest create ${repo.id}:${repo.tag} ${referencesDigest.map((digest) => `${repo.id}@${digest}`)} ${repo.id}@${digest}`;
                await $`docker manifest push ${repo.id}:${repo.tag}`;
            } else {
                // 是镜像，先修改镜像的 tag 为对应 platform 的 tag
                // 先通过 repo.tag 记录当前的 digest
                const existDigest = tagCheckResponse.data.digest;
                const { os, architecture } = extra_attrs;

                // 删除该 tag
                await this._deletaTag(harbor, repo, existDigest);
                // 换成对应系统架构的tag
                await this._addTag(harbor, {...repo, tag:`${repo.tag}-${os}_${architecture}`}, existDigest);
                
                // 重新将这个镜像和我上传的镜像 push 到新的分组下
                await $`docker manifest create ${repo.id}:${repo.tag} ${repo.id}@${existDigest} ${repo.id}@${digest}`;
                await $`docker manifest push ${repo.id}:${repo.tag}`;
            }
        } catch (error) {
            if (error.response?.status === 404) {
                // 如果 repo.tag 不存在就直接 push 到新的分组下
                await $`docker manifest create ${repo.id}:${repo.tag} ${repo.id}@${digest}`;
                await $`docker manifest push ${repo.id}:${repo.tag}`;
            } else {
                throw error;
            }
        }
        this.fastify.log.info(
            `镜像${harbor.imageUrl}/${repo.id}:${repo.tag}已成功上传！`
        );
    }

    async _pull(
        repoName: string,
        tag: string,
        platform: Platform,
        options: {
            getPackageDocument: IDockerManager["getImageDocument"];
        }
    ) {
        const { getPackageDocument } = options;
        let localExsit = false;
        // 通过docker images 命令先记录下所有的 IMAGE ID
        const backupImages = (await $`docker images -q`).stdout
            .split("\n")
            .filter(Boolean);

        // 获取dockerhub上`${repoName}:${tag}`的digest

        const doc = await getPackageDocument(repoName, tag, platform);
        if (doc === null) {
            throw new Error(`找不到${repoName}/${tag}/${platform}对应的镜像`);
        }
        this.fastify.log.debug(
            `${repoName}/${tag}对应的digest: ${doc?.digest}`
        );

        // 通过docker images --digests 判断本地容器里是否有这样的镜像，如果没有则拉取
        const localDigests = (
            await $`docker images --digests --format "{{.Digest}}"`
        ).stdout
            .split("\n")
            .filter(Boolean);
        if (!localDigests.includes(doc.digest)) {
            this.fastify.log.debug(
                `本地没有${doc.digest}对应的镜像，开始拉取...`
            );
            await $`docker pull ${this.uplink.imageUrl}/${repoName}@${doc.digest}`;
        }

        // 拉取完成后通过digest找到镜像，记录 IMAGE ID，如果这条IMAGE ID之前不存在，最后save之后要删掉这条镜像
        const newImages = (await $`docker images -q`).stdout
            .split("\n")
            .filter(Boolean);
        let newImageId: string | null | undefined = newImages.find(
            (id) => !backupImages.includes(id)
        );
        if (!newImageId) {
            this.fastify.log.debug(
                `没有出现新增的imageId，可能是之前就有这个镜像`
            );
            // 之前就有这个镜像，只是digest不一样
            localExsit = true;
        }

        // 将新拉取的镜像的 IMAGE ID 与 digest 对应起来
        const imageIdByDigest =
            await $`docker images --digests --format "{{.ID}} {{.Digest}}"`;
        const imageIdMap = imageIdByDigest.stdout.split("\n").map((line) => {
            const [id, digest] = line.split(" ");
            return { id, digest };
        });
        const matchedImage = imageIdMap.find(
            (image) => image.digest === doc.digest
        );
        if (!matchedImage?.id) {
            throw new Error(`找不到${doc.digest}对应的镜像!`);
        }
        newImageId = matchedImage.id;
        this.fastify.log.debug(`映射关系：${doc.digest} -> ${newImageId}`);

        return {
            id: repoName,
            name: repoName,
            tag,
            platform,
            imageId: newImageId,
            digest: doc.digest,
            localExsit,
        };
    }

    /**
     * 下载 Docker 镜像为 tar 文件，保存元数据，并将它们压缩成一个 tar.gz 文件。
     *
     * @param repos - 包含 id、tag 和 platform 的仓库对象数组。
     * @param workspace - 保存 tar 文件和元数据的目录。
     * @param fastify - 可选的 Fastify 实例用于日志记录。
     * @returns 压缩的 tar.gz 文件的绝对路径。
     *
     * @example
     * ```typescript
     * const repos = [
     *   { id: 'library/nginx', tag: 'latest', platform: 'linux/amd64' },
     *   { id: 'library/node', tag: '14', platform: 'linux/amd64' }
     * ];
     * const workspace = '/path/to/workspace';
     * const tarGzPath = await downloadTar(repos, workspace);
     * console.log(`Tar.gz 文件创建于: ${tarGzPath}`);
     * ```
     */
    async _downloadTar(
        repos: { id: string; tag: string; platform: Platform }[],
        workspace: string,
        options: {
            pull: IDockerManager["pull"];
        }
    ) {
        const { pull } = options ?? {};
        const metadataGroup: RepoMetaGroup = {
            repos: [],
        };
        // 清空
        sync(workspace);
        //先保证tar目录的存在
        const tarRoot = "tar";
        const absoluteTarRoot = resolve(workspace, tarRoot);
        mkdirSync(absoluteTarRoot, { recursive: true });
        // 逐个处理包
        for (const repo of repos) {
            const { id, tag, platform } = repo;
            this.fastify.log.info(`开始处理${id}:${tag}...`);
            const metadata = await pull(id, tag, platform);
            const relativeTarFile = join(
                tarRoot,
                `${id.replace("/", "_")}_${tag}_${platform.replace(
                    "/",
                    "_"
                )}.tar`
            );
            await this.save(
                metadata.imageId,
                resolve(workspace, relativeTarFile)
            );
            // 如果是程序拉取的镜像，传输完成后需要清理
            if (!metadata.localExsit) {
                await $`docker rmi ${metadata.imageId}`;
            }
            metadata.tarFile = relativeTarFile;
            metadataGroup.repos.push(metadata);
            this.fastify.log.info(`${id}:${tag}处理完成`);
        }
        const metadataJsonPath = resolve(workspace, "metadata.json");
        await promises.writeFile(
            metadataJsonPath,
            JSON.stringify(metadataGroup, null, 2)
        );
        const zipFileName = `dockertar_${Date.now()}.tar.gz`;
        await $`cd ${workspace} && tar -czvf ${zipFileName} -C ${workspace} *`;
        this.fastify.log.info(`下载文件已准备：${zipFileName}`);
        return resolve(workspace, zipFileName);
    }

    async uploadTar(file: string) {
        if (this.harbor === undefined) {
            const err = new Error("没有配置harbor的url，无法上传镜像");
            throw err;
        }
        //解压这个文件
        await $`cd ${this.tmp} && tar -xvf ${file}`;
        const configFile = resolve(this.tmp, "metadata.json");
        const metadataGroup = JSON.parse(
            await promises.readFile(configFile, "utf-8")
        ) as { repos: RepoMetaData[] };
        for (const repo of metadataGroup.repos) {
            // 先通过harbor的接口判断digest在harbor里是否存在
            // 如果存在则跳过这个镜像记录下这个跳过，因为这个方法要输出报告，成功几个，失败几个，跳过几个
            const [project, name] = repo.id.split("/");
            let harborDigestCheck;
            try {
                harborDigestCheck = await axios.get(
                    `${this.harbor.url}/api/v2.0/projects/${project}/repositories/${name}/artifacts/${repo.digest}/tags`, {
                        auth: {
                            username: this.harbor.username,
                            password: this.harbor.password
                        }
                    }
                );
                this.fastify.log.info(
                    `镜像 ${repo.id}:${repo.tag}-${repo.platform} 已存在于 Harbor，跳过上传`
                );
                continue;
            } catch (error) {
                if (error.response?.status !== 404) {
                    throw error;
                }
            }

            // 如果不存在，则通过docker images判断 本地imageId是不是有这个repo
            const localImageCheck = (
                await $`docker images -q ${
                    project === "library" ? name : repo.id
                }:${repo.tag}`
            ).stdout.trim();
            if (localImageCheck) {
                // 如果有这个imageId说明本地存在，记录一下本地存在，repo.localExist 设置为true ，恢复现场删除镜像的时候不删它
                repo.localExsit = true;
                this.fastify.log.info(
                    `本地存在镜像 ${repo.id}:${repo.tag}-${repo.platform}`
                );
                // 判断这个镜像的name(如果不包含scope手动补全为library)和tag是不是和repo一致，不一致就记录到报告中，失败原因就是”镜像在本地被认为修改“
                const localImageNameTagCheck = (
                    await $`docker images --format "{{.Repository}}:{{.Tag}}" ${repo.imageId}`
                ).stdout.trim();
                if (localImageNameTagCheck !== `${repo.id}:${repo.tag}`) {
                    this.fastify.log.error(
                        `本地镜像 ${repo.imageId} 的名称和标签与 ${repo.id}:${repo.tag}-${repo.platform} 不一致，失败原因：镜像在本地被认为修改`
                    );
                    continue;
                }
            } else {
                // 如果没有这个imageId说明本地不存在，记录一下本地不存在，repo.localExsit 设置为false ，恢复现场删除镜像的时候删它
                repo.localExsit = false;
                this.fastify.log.info(
                    `本地不存在镜像 ${repo.id}:${repo.tag}-${repo.platform}`
                );

                // 利用docker load 把 repo 路径中的tarFile 导入进来
                await $`docker load -i ${resolve(this.tmp, repo.tarFile!)}`;
            }

            // 如果digest存在，就检查下imageId 是不是都一致，不一致就跳过， 失败原因： “digest相同， imageId不可能不同”，
            const harborImageIdCheck = (
                await $`docker images --digests --format "{{.ID}}" ${repo.id}:${repo.tag}`
            ).stdout.trim();
            if (harborImageIdCheck && harborImageIdCheck !== repo.imageId) {
                this.fastify.log.error(
                    `镜像 ${repo.id}:${repo.tag}-${repo.platform} 的 digest 相同，但 imageId 不一致，跳过上传，失败原因：digest相同， imageId不可能不同`
                );
                continue;
            }

            // 调用push方法去推送到远程
            await this.push(repo);
            // 清理手动导入的镜像
            await this.cleanImage(repo);
        }
    }

    getUploadDir() {
        return this.tmp;
    }
}
