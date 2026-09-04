import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ALL_CONDITIONS_MOVE_NAMES, MOVE_CONDITIONS } from "../module/helpers/move-condition-map.mjs";
import enTranslations from "../languages/en.json";

// Guards the name-based matching basic-move-conditions.mjs and
// powerful-blow.mjs rely on: a typo or a renamed/removed pack move here
// would otherwise silently stop applying the automation with no error.
const packsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/packs");

function collectPackMoveNames() {
	const names = new Set();
	for (const entry of readdirSync(packsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const dirPath = path.join(packsDir, entry.name);
		for (const file of readdirSync(dirPath)) {
			if (!file.endsWith(".json")) continue;
			const data = JSON.parse(readFileSync(path.join(dirPath, file), "utf8"));
			if (data.type === "move") names.add(data.name);
		}
	}
	return names;
}

const packMoveNames = collectPackMoveNames();

// The single-word condition names basic-move-conditions.mjs matches against
// checkbox.dataset.content.split(" ")[0] — derived from the same localized
// labels the sheet actually renders, so a copy edit to en.json is caught
// here too.
const conditionNames = Object.values(
	enTranslations["MASKS-SHEETS"].CharacterSheets.conditions.options
).map((label) => label.split(" ")[0]);

describe("move-condition-map", () => {
	it("every MOVE_CONDITIONS key matches a real move's name in src/packs/", () => {
		const missing = Object.keys(MOVE_CONDITIONS).filter((name) => !packMoveNames.has(name));
		expect(missing).toEqual([]);
	});

	it("every MOVE_CONDITIONS value is one of the five known, single-word condition names", () => {
		const bad = Object.entries(MOVE_CONDITIONS).filter(
			([, condition]) => !conditionNames.includes(condition) || condition.includes(" ")
		);
		expect(bad).toEqual([]);
	});

	it("every ALL_CONDITIONS_MOVE_NAMES entry matches a real move's name in src/packs/", () => {
		const missing = ALL_CONDITIONS_MOVE_NAMES.filter((name) => !packMoveNames.has(name));
		expect(missing).toEqual([]);
	});
});
