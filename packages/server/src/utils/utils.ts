import { maxSatisfying } from "semver";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { FastifyInstance } from "fastify";
import { networkInterfaces } from "os";
import { getPackageDocument } from "../model/base.ts";
import { PelipperConfig } from "src/types/index";
import { resolve } from "path";
import { createArchiveByFileExtension } from "@shockpkg/archive-files";
import { accessSync, constants } from "fs";
const nets = networkInterfaces();

export const isBusy = (fastify: FastifyInstance) => {
  return fastify.globalState.npmDownloading || fastify.globalState.npmUploding;
};

export const getNPMCommand = () => {
  return /^win/.test(process.platform) ? "npm.cmd" : "npm";
};

const _getLocalIPv4Address = () => {
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results[0];
  //return results[0]!.replace(/192\.168\.2\.99/g, 'nas.tchen.fun');
}

const _getLocalNpmConfig = (fastify: FastifyInstance) => {
  const entireConfig = fastify.REGISTER_CONFIG;
  const from = entireConfig.fronttype;
  const config = from === 'npmjs' ? entireConfig.npmjs : entireConfig.pelipper;
  const url = `http://${_getLocalIPv4Address()}:${config.port}`;
  return {
    ...config,
    from, // npm 和 pelipper 对获取tarball的方式不同
    url,
  };
}

export const getLocalNpmConfig = _getLocalNpmConfig;

export const getEnvs = (fastify: FastifyInstance, type: 'pull' | 'push') => {
  const { url: npmRegistry, mirrorPath, remote } = _getLocalNpmConfig(fastify);
  const binaryHosts = fastify.MIRROR_CONFIG;
  const result = [];
  for (const key in binaryHosts) {
    if (Object.prototype.hasOwnProperty.call(binaryHosts, key)) {
      let host = mirrorPath;
      if (!/^http/.test(mirrorPath)) {
        host = `http://${_getLocalIPv4Address()}:${fastify.REGISTER_CONFIG.app.port}${mirrorPath}`;
      }
      const binaryHost = `${host}/${binaryHosts[key]}`;
      result.push(`--${key}=${binaryHost}`);
    }
  }
  result.push(`--registry=${type === "pull" ? npmRegistry : remote}`);
  return result;
};

/**
 * Spawns a new process using the given command and arguments, and wraps it in a Promise.
 * 
 * @param command - The command to run.
 * @param args - List of string arguments.
 * @param opts - Optional options to pass to the spawn function.
 * @returns A Promise that resolves with the spawned ChildProcessWithoutNullStreams instance if the process completes successfully, or rejects with an error string if the process writes to stderr.
 */
export const spawnWrap = (command: string, args: string[], opts?: any) => {
  let errors = "";
  const { ignoreErrors } = opts || {};
  const thread = spawn(command, args, opts);
  const name = `${command} ${args.join(" ")}`;
  thread.stdout?.on("data", (data) => {
    console.log(`${name}:${data}`);
  });
  thread.stderr?.on("data", (error) => {
    errors = errors + "\n" + error.toString("utf-8");
  });

  return new Promise<ChildProcessWithoutNullStreams>((resolve, reject) => {
    thread.on("close", () => {
      if (ignoreErrors) {
        return resolve(thread);
      } else if (errors.length > 0) {
        return reject(errors);
      } else {
        return resolve(thread);
      }
    });
  });
};

export const getValidVersions = (pkg: any) => {
  return Object.keys(pkg.versions)
    .reverse()
    .filter((val) => {
      return !val.startsWith("_fee_");
    });
};

export const extractVersion = async function(fastify: FastifyInstance, name: string, semverVersion: string): Promise<null | [string, string]> {
  const pkg = await getPackageDocument(name, fastify);
  const versions = getValidVersions(pkg);
  const version = maxSatisfying(versions, semverVersion);
  if (!version) {
    // 如果指定的版本号无法匹配到正确的版本，分以下几种情况
    // npm的别名情况 @popperjs/core: npm:@sxzz/popperjs-es@^2.11.7 (提取出真正的版本)
    if (semverVersion.startsWith('npm:')) {
      const regex = /^npm:(.+)@(.*)$/;
      const match = semverVersion.match(regex);
      if (match && match.length > 2) {
        return await extractVersion(fastify, match[1]!, match[2]!);
      }
    }
    // pnpm项目的子项目 @element-plus/components: workspace:* (跳过)
    return null;
  }
  return [name, version];
}

const getTgzFile = (fastify: FastifyInstance, name: string, version: string) => {
  const { storage } = _getLocalNpmConfig(fastify) as PelipperConfig['pelipper'];
  const outPkg = resolve(storage, name, `${version}.tgz`);
  const matchResult = name.match(/[^\/]+$/);
  const prefixTgz = matchResult ? matchResult[0] : '';
  const innerPkg = resolve(storage, name, `${prefixTgz}-${version}.tgz`);
  try {
    accessSync(outPkg, constants.R_OK);
    return outPkg
  } catch (error) {
    return innerPkg;
  }
}

export const xx = async (tgz: string) => {
  let result = '';
  const archive = createArchiveByFileExtension(tgz);
  await archive?.read(async (entry) => {
    if (entry.path === 'package/README.md' || entry.path === 'package/readme.md') {
      const buffer = await entry.read();
      result = buffer?.toString('utf-8') || '# README.md not found';
    }
    return null;
  })
  return result;
}


export const getPackageReadme = async (fastify: FastifyInstance, name: string, version: string) => {
  const tgz = getTgzFile(fastify, name, version);
  return await xx(tgz);
}