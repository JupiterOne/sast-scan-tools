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
  sastDockerImage: string,
  dockerInDocker = false,
  verbose = false
): Promise<string> {
  await extractZipfile(path.join(tempDir, "lambda.zip"), tempDir);
  const scanType = detectLambdaScanType(runtime);
  console.log("scanning contents of extracted zipfile in: " + tempDir);

  let dockerArgs = ["run", "--rm", "-e", `WORKSPACE=${tempDir}`];
  if (dockerInDocker) {
    // running this code inside a docker container requires a passthru volume
    // mount for the outer docker socket
    dockerArgs = dockerArgs.concat([
      "-v",
      "/var/run/docker.sock:/var/run/docker.sock",
    ]);
  }
  dockerArgs = dockerArgs.concat([
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
  ]);
  console.log("cmd: docker " + dockerArgs.join(" "));
  try {
    await spawnAsync("docker", dockerArgs);
  } catch (err) {
    console.error("Docker error, exited with code: " + err.code);
    console.error("Stderr: " + err.stderr.toString());
    throw new Error("Unrecoverable Docker error!");
  }
  if (verbose) {
    const lsTmp = await spawnAsync("ls", ["-l", "/tmp/"]);
    console.log(lsTmp.toString());
    const lsTempDir = await spawnAsync("ls", ["-l", tempDir]);
    console.log(lsTempDir.toString());
    const mountOutput = await spawnAsync("mount");
    console.log(mountOutput.toString());
  }
  // return path to generic 'all-' report, which may include findings from any runtime scanner
  const reportPath = (await Files.any(tempDir + "/all-*-report.json")).files[0];
  return reportPath;
}
