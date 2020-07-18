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
  verbose = false
): Promise<string> {
  let dockerOutput;
  try {
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
    if (verbose) {
      console.log("cmd: docker " + dockerArgs.join(" "));
    }

    dockerOutput = await spawnAsync("docker", dockerArgs);
    if (verbose) {
      console.log(dockerOutput.toString());
    }
  } catch (err) {
    if (err.code && err.stderr) {
      console.warn("Docker error, exited with code: " + err.code);
      console.warn("Stderr: " + err.stderr.toString());
    } else {
      console.warn("Error scanning lambda: ", err);
    }
  }
  // return path to generic 'all-' report, which when present may include findings from any runtime scanner
  const fileScan = await Files.any(tempDir + "/all-*-report.json");
  return fileScan.files[0];
}
