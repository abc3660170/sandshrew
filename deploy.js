import { existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join } from "path";
import { cp } from "fs";
import { readFile } from "fs/promises";
import { spawn } from "child_process";
const dir = join(process.cwd(), "build");

(async () => {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  } else {
    const files = readdirSync(dir);
    if (files.length > 0) {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  await copyFiles(dir);
  const thread = spawn("npm", ["install", "--omit=dev"], {
    cwd: dir
  });
  thread.stdout?.on("data", (data) => {
    console.log(data.toString("utf-8"));
  });
  thread.stderr?.on("data", (error) => {
    console.log(error.toString("utf-8"));
  });
})();

async function copyFiles(dir) {
  const packageJsonPath = join(process.cwd(), "packages/server/package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
  const filesToCopy = [...packageJson.files, "package.json"];

  filesToCopy.forEach((file) => {
    const src = join(process.cwd(), "packages/server", file);
    const dest = join(dir, file);
    cp(src, dest, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
}
