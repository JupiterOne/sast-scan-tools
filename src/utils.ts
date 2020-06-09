import fs from "fs-extra";
import axios from "axios";
import { createWriteStream } from "fs";
import uuidV4 from "uuid/v4";
import spawnAsync from "await-spawn";

export async function extractZipfile(
  zipFile: string,
  extractPath: string
): Promise<void> {
  await fs.ensureDir(extractPath);
  await spawnAsync("unzip", [zipFile, "-d", extractPath]);
}

export async function createTempDir(): Promise<string> {
  const tempDir = "/tmp/" + uuidV4();
  await fs.ensureDir(tempDir);
  return tempDir;
}

export async function cleanDir(dirPath: string): Promise<void> {
  return fs.remove(dirPath);
}

export function detectLambdaScanType(runtime: string): string {
  if (runtime.match(/nodejs/i)) {
    return "nodejs";
  }
  if (runtime.match(/python/i)) {
    return "python";
  }
  if (runtime.match(/go/i)) {
    return "go";
  }
  if (runtime.match(/java/i)) {
    return "java";
  }
  return "unknown";
}

export async function downloadFile(
  fileUrl: string,
  outFilePath: string
): Promise<boolean> {
  const writer = createWriteStream(outFilePath);
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  }).then((response) => {
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error: null | Error = null;
      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  });
}
