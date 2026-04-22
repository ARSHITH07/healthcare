import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendRoot, "..");
const backendEntry = path.join(repoRoot, "Backend", "main.py");
const viteEntry = path.join(frontendRoot, "node_modules", "vite", "bin", "vite.js");

const backendCommand = process.env.PYTHON_BIN || "python";
let vite = null;
let backend = null;

function startProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env || {}) },
    shell: options.shell ?? false,
    stdio: "inherit",
  });
}

async function waitForBackend(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the backend is ready or exits.
    }
    await delay(1000);
  }

  throw new Error(`Backend did not become ready at ${url}`);
}

async function startBackend() {
  backend = startProcess(backendCommand, [backendEntry], {
    cwd: repoRoot,
    env: { HEALTHCHAIN_DEBUG: "1" },
  });

  await waitForBackend("http://127.0.0.1:5000/blockchain");
}

let shuttingDown = false;
const shutdown = (code = 0) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (backend && !backend.killed) {
    backend.kill();
  }

  if (vite && !vite.killed) {
    vite.kill();
  }

  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting backend at http://127.0.0.1:5000 ...");
await startBackend();
console.log("Backend is ready.");

vite = startProcess(process.execPath, [viteEntry, "--host", "0.0.0.0"], { cwd: frontendRoot });

vite.on("exit", (code, signal) => {
  if (!shuttingDown) {
    console.error(`Vite exited (${signal || code || "unknown"}).`);
    shutdown(code && code !== 0 ? code : 0);
  }
});
