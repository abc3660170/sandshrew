import { FastifyInstance } from 'fastify';
import { UnknowRegistryConfig } from '@sandshrew/types';

declare module 'fastify' {
  export interface FastifyInstance {
    SANDSHREW_CONFIG: UnknowRegistryConfig;
    MIRROR_CONFIG: Record<string, string>;
    globalState: {
      npmDownloading: boolean;
      npmUploding: boolean;
      localNpm: any;
    }
  }
}