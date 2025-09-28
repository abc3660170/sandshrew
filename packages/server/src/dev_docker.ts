import { downloadTar, getPackageDocument, getVersions, pull } from "./model/dockerhub/hub.ts";
import { getDockerHubToken } from "./utils/utils.ts";

// console.log(await getSuggestions('nginx'))


// console.log(await getPackageDocument('nginx', '1.21.5', 'linux/amd64'))

// console.log(await getDockerHubToken('library/nginx', 'pull'))

// console.log(await getVersions('library/nginx', 'pull'))

// console.log(await pull('library/nginx', '1.21.5', 'linux/amd64'));
// console.log(await downloadTar([{
//     id: 'library/nginx',
//     tag: '1.21.5',
//     platform: 'linux/amd64'
// }, {
//     id: 'library/nginx',
//     tag: '1.21.5',
//     platform: 'linux/arm64'
// }],'/volume1/homes/abc3660170/remote-development/sandshrew/tmp/docker'))