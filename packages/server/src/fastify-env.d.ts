import { FastifyInstance } from 'fastify';
import { UnknowRegistryConfig } from './types';

declare module 'fastify' {
  export interface FastifyInstance {
    REGISTER_CONFIG: UnknowRegistryConfig;
    MIRROR_CONFIG: Record<string, string>;
    globalState: {
      npmDownloading: boolean;
      npmUploding: boolean;
      localNpm: any;
    }
  }
}