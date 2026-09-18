/**
 * Copies the repo's non-linked root files into the local Foundry module install.
 *
 * The dev install is a real directory whose subfolders (css/, module/, languages/,
 * packs/, templates/) are junctions back to this repo, but whose root files are
 * plain copies - a top-level junction breaks Foundry's module discovery, because
 * fs.readdir reports a reparse point as isDirectory() === false.
 *
 * The consequence is that editing module.json here has NO runtime effect until it
 * is re-copied: Foundry reads the stale copy, so a newly registered stylesheet,
 * language, or pack is simply invisible with no error at any step. Run this after
 * every module.json edit, then fully reload Foundry (manifests are not hot-reloaded).
 *
 * Override the destination with FOUNDRY_MODULE_PATH if your data path is not the
 * Windows default.
 */
import { readFileSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";

const COPIED_FILES = ["module.json", "LICENSE", "README.md"];

const { id } = JSON.parse(readFileSync("module.json", "utf8"));

const installPath =
	process.env.FOUNDRY_MODULE_PATH ??
	path.join(process.env.LOCALAPPDATA ?? "", "FoundryVTT", "Data", "modules", id);

if (!process.env.LOCALAPPDATA && !process.env.FOUNDRY_MODULE_PATH) {
	console.error("Set FOUNDRY_MODULE_PATH - LOCALAPPDATA is unset, so the default install path can't be derived.");
	process.exit(1);
}

// Deliberately not created if missing: that means the path is wrong, and silently
// making an empty directory would look like success while Foundry still sees nothing.
if (!existsSync(installPath)) {
	console.error(`No module install at ${installPath}`);
	console.error("Set FOUNDRY_MODULE_PATH to the installed module directory.");
	process.exit(1);
}

let copied = 0;
for (const file of COPIED_FILES) {
	if (!existsSync(file)) continue;

	const dest = path.join(installPath, file);
	const changed = !existsSync(dest) || readFileSync(file, "utf8") !== readFileSync(dest, "utf8");

	if (changed) {
		copyFileSync(file, dest);
		copied += 1;
	}
	console.log(`${changed ? "updated" : "  same "}  ${file}`);
}

console.log(`\n${installPath}`);
console.log(
	copied
		? `${copied} file(s) updated - fully reload Foundry for the new manifest to take effect.`
		: "Already in sync."
);
