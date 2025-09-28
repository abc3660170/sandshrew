import { resolve } from 'path';
import { start } from "./index.js";
import { parse } from 'yaml';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { UnknowRegistryConfig } from '@sandshrew/types';
const __filename = fileURLToPath(import.meta.url);
const configFile = resolve(__filename, "../test/config.yml");
const config = readFileSync(configFile, 'utf8')
const doc = parse(config) as UnknowRegistryConfig;
await start(doc);