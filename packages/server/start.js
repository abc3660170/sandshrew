import { start } from "./dist/index.js";
import { parse } from 'yaml';
import { readFileSync } from 'fs';
const argv = process.argv;
if(argv['2'] !== '--conf' || !argv['3']){
    throw new Error('没有传入配置文件！！');
}
const configFile = argv['3'];
const config = readFileSync(configFile, 'utf8')
const doc = parse(config);
await start(doc)