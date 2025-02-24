import axios from 'axios';
import { Packument } from "@npm/types";
export const getValidVersions = (pkg: Packument) => {
  return Object.keys(pkg.versions)
    .reverse()
    .filter((val) => {
      return !val.startsWith("_fee_");
    });
};


export const getAxios = () => {
  return axios.create({
    // @ts-ignore
    baseURL: import.meta.env.MODE === 'development' ? `${location.protocol}//${location.hostname}:${import.meta.env.VITE_SERVER_PORT}` : '/',
  });
}

export const getEnv = async () => {
  const res = await (getAxios()
      .get<any>(`/env/`))
    return res.data
}