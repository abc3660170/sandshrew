import { Packument } from "@npm/types";
import axios from "axios";
import { FastifyInstance } from "fastify";
import { readdir, readFile } from "fs";
import path from "path";
import { RegistryConfig } from "src/types";

export async function getSuggestions(
  q: string,
  fastify: FastifyInstance
) {
  const nsMatcher = /(^.+)\//.exec(q);
  const pkgMatcher = /[^\/]+$/.exec(q);
  const ns = nsMatcher ? nsMatcher[1] : "";
  const pkg = pkgMatcher ? pkgMatcher[0] : "";
  const { fronttype } = fastify.REGISTER_CONFIG;
  if (fronttype === "npmjs") {
    const response = await axios.get(
      `https://www.npmjs.com/search/suggestions?q=${q}`
    );
    return response.data;
  } else if (fronttype === "pelipper") {
    return new Promise((resolve, reject) => {
      const conf = fastify.REGISTER_CONFIG as RegistryConfig<'pelipper'>
      if (!conf.pelipper.storage) {
        return reject(new Error("pelipper's  storage configration is empty!"));
      }
      const nsDir = path.resolve(conf.pelipper.storage, ns!);
      readdir(`${nsDir}`, "utf-8", (error, files) => {
        if (error) {
          return reject(error);
        }
        resolve(
          files
            .filter((file) => {
              return (
                // @一般都不是包名而是ns名，包不能为空担心返回太多结果
                pkg.trim() !== "" &&
                file.startsWith(pkg) &&
                !file.startsWith("@")
              );
            })
            .map((file) => {
              return {
                name: path.join(ns!, file),
              };
            })
        );
      });
    });
  } else {
    throw new Error("frontType is not in ['npmjs, pelipper']");
  }
}


export const  getPackageDocument = async (pkgName: string,  fastify: FastifyInstance): Promise<Packument> => {
  const { fronttype } =  fastify.REGISTER_CONFIG;
  if (fronttype === "npmjs") {
    const response = await axios.get(
      `https://registry.npmjs.org/${pkgName}`
    );
    return response.data;
  } else if (fronttype === "pelipper") {
    const conf = fastify.REGISTER_CONFIG as RegistryConfig<'pelipper'>;
    const pkg = path.resolve(conf.pelipper.storage, pkgName, "package.json");
    return new Promise((resolve, reject) => {
      readFile(pkg, "utf-8", (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(JSON.parse(data));
      });
    });
  } else {
    throw new Error("frontType is not in ['npmjs, pelipper']");
  }
}
