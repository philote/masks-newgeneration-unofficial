import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CANONICAL_REPO = "https://github.com/philote/masks-newgeneration-unofficial";

// The 2.x work was developed in ctincorvia/masks-newgeneration-unofficial-overhaul (later archived)
// and merged back here in 2.1.1; these guard against a stale fork URL creeping back in.
const RETIRED_REPO_PATTERN = /ctincorvia\/masks-newgeneration-unofficial/;

function readProjectFile(...segments) {
	return readFileSync(resolve(process.cwd(), ...segments), "utf8");
}

describe("project links", () => {
	it("opens the canonical repo from the Settings sidebar GitHub button", () => {
		const source = readProjectFile("module", "masks.mjs");

		expect(source).toContain(`window.open("${CANONICAL_REPO}", "_blank")`);
		expect(source).not.toMatch(RETIRED_REPO_PATTERN);
	});

	it("points module.json's bug reports and media at the canonical repo", () => {
		const manifest = JSON.parse(readProjectFile("module.json"));

		expect(manifest["bug-reports"]).toBe(`${CANONICAL_REPO}/issues`);
		expect(manifest.media.length).toBeGreaterThan(0);
		for (const entry of manifest.media) {
			expect(entry.url).toMatch(/^https:\/\/raw\.githubusercontent\.com\/philote\/masks-newgeneration-unofficial\//);
		}
	});

	it("points package.json at the canonical repo", () => {
		const pkg = JSON.parse(readProjectFile("package.json"));

		expect(pkg.repository.url).toBe(`${CANONICAL_REPO}.git`);
		expect(pkg.homepage).toBe(CANONICAL_REPO);
		expect(pkg.bugs).toBe(`${CANONICAL_REPO}/issues`);
	});

	it("keeps the README free of retired fork URLs", () => {
		expect(readProjectFile("README.md")).not.toMatch(RETIRED_REPO_PATTERN);
	});

	it("ships a manifest whose version is left for the release workflow to substitute", () => {
		const manifest = JSON.parse(readProjectFile("module.json"));

		expect(manifest.version).toBe("#{VERSION}#");
	});
});
