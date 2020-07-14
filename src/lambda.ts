import { lambda } from "./aws";
import { extractZipfile } from "./fsutils";
import path from "path";
import { Files } from "@zouloux/files";
import spawnAsync from "await-spawn";

export { lambda };

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

export async function scanLambda(
  tempDir: string,
  runtime: string,
  sastDockerImage: string
): Promise<string> {
  await extractZipfile(path.join(tempDir, "lambda.zip"), tempDir);
  const scanType = detectLambdaScanType(runtime);
  console.log("scanning contents of extracted zipfile in: " + tempDir);
  const dockerArgs = [
    "run",
    "--rm",
    "-e",
    `WORKSPACE=${tempDir}`,
    "-v",
    `${tempDir}:/lambdazip:cached`,
    sastDockerImage,
    "scan",
    "--src",
    "/lambdazip" /* virtual, volume-mounted path */,
    "--type",
    scanType,
    "--out_dir",
    "/lambdazip",
  ];
  console.log("cmd: docker " + dockerArgs.join(" "));
  await spawnAsync("docker", dockerArgs);
  // return path to generic 'all-' report, which may include findings from any runtime scanner
  const reportPath = (await Files.any(tempDir + "/all-*-report.json")).files[0];
  return reportPath;
}
