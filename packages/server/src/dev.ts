import { resolve } from 'path';
import { start } from "./index.js";
import { parse } from 'yaml';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { UnknowRegistryConfig } from './types/index.js';
const __filename = fileURLToPath(import.meta.url);
const configFile = resolve(__filename, "../test/config.yml");
const mirrorFile = resolve(__filename, "../test/mirror.yml");
const config = readFileSync(configFile, 'utf8')
const mirror = readFileSync(mirrorFile, 'utf8')
const doc = parse(config) as UnknowRegistryConfig;
const mirrorConfig = parse(mirror) as Record<string, string>;
await start(doc, mirrorConfig)