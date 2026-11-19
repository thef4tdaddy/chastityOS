import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

describe("build entry and config", () => {
  it("index.html module entry points at a file that exists", () => {
    const html = readFileSync(`${root}index.html`, "utf8");
    const match = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/);
    expect(match).not.toBeNull();
    const entry = match![1].replace(/^\//, "");
    expect(existsSync(`${root}${entry}`)).toBe(true);
  });

  it("build scripts pass the Vite config that exists in the repo", () => {
    const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
    const configPath = "configs/build/vite.config.js";
    expect(existsSync(`${root}${configPath}`)).toBe(true);
    for (const name of ["build", "build:nightly", "build:production"]) {
      expect(pkg.scripts[name]).toContain(`--config ${configPath}`);
    }
  });
});
