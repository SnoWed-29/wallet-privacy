import { spawn } from "node:child_process";
import { rmSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const testDataDir = join(root, ".tmp", "wallet-e2e-data");

function commandExists(command, args = ["--version"]) {
  return new Promise((resolveExists) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", () => resolveExists(false));
    child.on("exit", (code) => resolveExists(code === 0));
  });
}

if (!(await commandExists("tauri-driver"))) {
  console.error(
    "tauri-driver is required for desktop E2E tests. Install it with: cargo install tauri-driver",
  );
  process.exit(1);
}

rmSync(testDataDir, { recursive: true, force: true });
mkdirSync(testDataDir, { recursive: true });

const env = {
  ...process.env,
  WALLET_TEST_MODE: "true",
  WALLET_TEST_DATA_DIR: testDataDir,
};

const driver = spawn("tauri-driver", ["--port", "4444"], {
  cwd: root,
  env,
  stdio: "inherit",
});

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const app = spawn(npmCommand, ["run", "tauri", "--", "dev"], {
  cwd: root,
  env,
  stdio: "inherit",
});

function shutdown() {
  app.kill();
  driver.kill();
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

app.on("exit", (code) => {
  driver.kill();
  process.exit(code ?? 1);
});
