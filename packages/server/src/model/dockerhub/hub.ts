import axios from "axios";
import { FetchRepo, FetchRepoTags, Platform, RepoMetaData, RepoMetaGroup } from "@sandshrew/types";
import { getDockerHubToken } from "../../utils/utils.ts";
import { $ } from "zx";
import { FastifyInstance } from "fastify";
import { join, resolve } from "path";
import { mkdirSync, promises } from "fs";
import { sync } from "rimraf";

const DOCKERHUB_API_URL = "https://hub.docker.com";
const REGISTRY_API_URL = "https://registry-1.docker.io";
const HUAFEI_API_URL = "http://10.0.254.1";

/**
 * 根据提供的关键字从 Docker Hub 获取建议。
 *
 * @param keyword - 用于查询 Docker Hub 建议的搜索词。
 * @returns 一个 Promise，解析为来自 Docker Hub 的搜索结果数组。
 */
export const getSuggestions = async (keyword: string) => {
  const response = await axios.get<FetchRepo>(
    `${DOCKERHUB_API_URL}/api/search/v4?from=0&size=4&query=${keyword}`
  );
  return response.data.results;
};

//todo 模糊查询tags
//https://hub.docker.com

/**
 * 从 Docker Hub 获取给定仓库名称、版本和平台的包文档。
 *
 * @param repoName - 仓库名称。
 * @param version - 包的版本。
 * @param platform - 平台字符串，格式为 "os/architecture"。
 * @returns 如果找到目标镜像对象，则返回该对象，否则返回 null。
 */
export const getPackageDocument = async (
  repoName: string,
  tag: string,
  platform: Platform
) => {
  const os = platform.split("/")[0];
  const architecture = platform.split("/")[1];
  const response = await axios.get<FetchRepoTags>(
    `${DOCKERHUB_API_URL}/v2/repositories/${encodeURIComponent(
      repoName
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
};

/**
 * 从 Docker Hub 获取给定仓库名称的所有版本。
 *
 * @param repoName - 仓库名称。
 * @param operate - 操作类型。
 * @returns 一个 Promise，解析为包含所有版本的数组。
 */
export const getVersions = async (repoName: string, operate: string) => {
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

export const pull = async (
  repoName: string,
  tag: string,
  platform: Platform,
  options?: {
    fastify?: FastifyInstance;
  }
): Promise<RepoMetaData> => {
  const { fastify } = options || {};
  let localExsit = false;
  // 通过docker images 命令先记录下所有的 IMAGE ID
  const backupImages = (await $`docker images -q`).stdout
    .split("\n")
    .filter(Boolean);

  // 获取dockerhub上`${repoName}:${tag}`的digest
  
    const doc = await getPackageDocument(repoName, tag, platform);
    if(doc === null) {
        throw new Error(`找不到${repoName}/${tag}/${platform}对应的镜像`);
    }
    fastify?.log.debug(`${repoName}/${tag}对应的digest: ${doc?.digest}`);

    // 通过docker images --digests 判断本地容器里是否有这样的镜像，如果没有则拉取
    const localDigests = (
      await $`docker images --digests --format "{{.Digest}}"`
    ).stdout
      .split("\n")
      .filter(Boolean);
    if (!localDigests.includes(doc.digest)) {
        fastify?.log.debug(`本地没有${doc.digest}对应的镜像，开始拉取...`);
      await $`docker pull ${repoName}@${doc.digest}`;
    }

    // 拉取完成后通过digest找到镜像，记录 IMAGE ID，如果这条IMAGE ID之前不存在，最后save之后要删掉这条镜像
    const newImages = (await $`docker images -q`).stdout
      .split("\n")
      .filter(Boolean);
    let newImageId: string | null | undefined = newImages.find(
      (id) => !backupImages.includes(id)
    );
    if (!newImageId) {
        fastify?.log.debug(`没有出现新增的imageId，可能是之前就有这个镜像`);
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
    const matchedImage = imageIdMap.find((image) => image.digest === doc.digest);
    if(!matchedImage?.id) {
        throw new Error(`找不到${doc.digest}对应的镜像!`);
    }
    newImageId = matchedImage.id;
    fastify?.log.debug(`映射关系：${doc.digest} -> ${newImageId}`);

    return {
      id: repoName,
      name: repoName,
      tag,
      platform,
      imageId: newImageId,
      digest: doc.digest,
      localExsit,
    };
};

// 保存镜像
export const save = async (imageId: string, output: string) => {
  await $`docker save -o ${output} ${imageId}`;
  return output;
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
export const downloadTar = async (repos: {id: string,
  tag: string,
  platform: Platform}[], workspace: string, fastify?: FastifyInstance) => {
    const metadataGroup: RepoMetaGroup = {
      repos: [] 
    };
    // 清空
    sync(workspace)
    //先保证tar目录的存在
    const tarRoot = 'tar';
    const absoluteTarRoot = resolve(workspace, tarRoot);
    mkdirSync(absoluteTarRoot, {recursive: true})
    // 逐个处理包
    for (const repo of repos) {
      const {id, tag, platform} = repo;
      fastify?.log.info(`开始处理${id}:${tag}...`);
      const metadata = await pull(id, tag, platform);
      const relativeTarFile = join(tarRoot, `${id.replace('/','_')}_${tag}_${platform.replace('/','_')}.tar`);
      await save(metadata.imageId, resolve(workspace, relativeTarFile));
      // 如果是程序拉取的镜像，传输完成后需要清理
      if(!metadata.localExsit) {
        await $`docker rmi ${metadata.imageId}`
      }
      metadata.tarFile = relativeTarFile;
      metadataGroup.repos.push(metadata);
      fastify?.log.info(`${id}:${tag}处理完成`);
    }
    const metadataJsonPath = resolve(workspace, 'metadata.json');
    await promises.writeFile(metadataJsonPath, JSON.stringify(metadataGroup, null, 2));
    const zipFileName = `dockertar_${Date.now()}.tar.gz`;
    await $`cd ${workspace} && tar -czvf ${zipFileName} -C ${workspace} *`;
    fastify?.log.info(`下载文件已准备：${zipFileName}`);
    return resolve(workspace, zipFileName);
}

export const uploadTar = async (file: string, workspace: string, options?: {
  fastify?: FastifyInstance
}) => {
  const fastify = (options  || {}).fastify;
  //解压这个文件
  await $`cd ${workspace} && tar -xvf ${file}`;
  const configFile = resolve(workspace, 'metadata.json');
  const metadataGroup = JSON.parse(await promises.readFile(configFile, 'utf-8')) as { repos: RepoMetaData[] };
  for (const repo of metadataGroup.repos) {
    // 先通过harbor的接口判断digest在harbor里是否存在
    // 如果存在则跳过这个镜像记录下这个跳过，因为这个方法要输出报告，成功几个，失败几个，跳过几个
    const [project, name] = repo.id.split('/');
    let harborDigestCheck;
    try {
      harborDigestCheck = await axios.get(`${HUAFEI_API_URL}/api/v2.0/projects/${project}/repositories/${name}/artifacts/${repo.digest}/tags`);
      fastify?.log.info(`镜像 ${repo.id}:${repo.tag} 已存在于 Harbor，跳过上传`);
      continue;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }

    // 如果不存在，则通过docker images判断 本地imageId是不是有这个repo
    const localImageCheck = (await $`docker images -q ${project === 'library' ? name : repo.id }:${repo.tag}`).stdout.trim();
    if (localImageCheck) {
      // 如果有这个imageId说明本地存在，记录一下本地存在，repo.localExist 设置为true ，恢复现场删除镜像的时候不删它
      repo.localExsit = true;
      fastify?.log.info(`本地存在镜像 ${repo.id}:${repo.tag}`);
      // 判断这个镜像的name(如果不包含scope手动补全为library)和tag是不是和repo一致，不一致就记录到报告中，失败原因就是”镜像在本地被认为修改“
      const localImageNameTagCheck = (await $`docker images --format "{{.Repository}}:{{.Tag}}" ${repo.imageId}`).stdout.trim();
      if (localImageNameTagCheck !== `${repo.id}:${repo.tag}`) {
        fastify?.log.error(`本地镜像 ${repo.imageId} 的名称和标签与 ${repo.id}:${repo.tag} 不一致，失败原因：镜像在本地被认为修改`);
        continue;
      }
    } else {
      // 如果没有这个imageId说明本地不存在，记录一下本地不存在，repo.localExsit 设置为false ，恢复现场删除镜像的时候删它
      repo.localExsit = false;
      fastify?.log.info(`本地不存在镜像 ${repo.id}:${repo.tag}`);

      // 利用docker load 把 repo 路径中的tarFile 导入进来
      await $`docker load -i ${resolve(workspace, repo.tarFile!)}`;
    }

    // 如果digest存在，就检查下imageId 是不是都一致，不一致就跳过， 失败原因： “digest相同， imageId不可能不同”，
    const harborImageIdCheck = (await $`docker images --digests --format "{{.ID}}" ${repo.id}:${repo.tag}`).stdout.trim();
    if (harborImageIdCheck && harborImageIdCheck !== repo.imageId) {
      fastify?.log.error(`镜像 ${repo.id}:${repo.tag} 的 digest 相同，但 imageId 不一致，跳过上传，失败原因：digest相同， imageId不可能不同`);
      continue;
    }

    // 调用push方法去推送到远程
    await push(repo, options);
    // 清理手动导入的镜像
    await cleanImage(repo);
  }
}

export const push = async (repo: RepoMetaData, options?: {
  fastify?: FastifyInstance
}) => {
  const fastify = options?.fastify;
  //todo 明文硬编码
  await $`echo Njhf@1212 | docker login ${HUAFEI_API_URL} -u admin --password-stdin`;
  await $`docker tag ${repo.imageId} ${HUAFEI_API_URL}/${repo.id}:${repo.tag}`;
  await $`docker push ${HUAFEI_API_URL}/${repo.id}:${repo.tag}`;
  fastify?.log.info(`镜像${HUAFEI_API_URL}/${repo.id}:${repo.tag}已成功上传！`)
}

export const cleanImage = async (repo: RepoMetaData) => {
  if(!repo.localExsit) {
    await $`docker rmi ${repo.imageId}`;
  }
}

