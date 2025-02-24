import { resolve } from 'path';
import { start } from "../dist/index.js";
import { parse } from 'yaml';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const configFile = resolve(__filename, "../test/config.yml");
const mirrorFile = resolve(__filename, "../test/mirror.yml");
const config = readFileSync(configFile, 'utf8')
const mirror = readFileSync(mirrorFile, 'utf8')
const doc = parse(config);
const mirrorConfig = parse(mirror);
await start(doc, mirrorConfig)