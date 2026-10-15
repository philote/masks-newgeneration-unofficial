import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { moveHasHoldStepper } from "../module/helpers/move-hold.mjs";

const PACKS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../src/packs");

function moveFiles() {
	return readdirSync(PACKS_DIR, { recursive: true })
		.map((file) => file.replaceAll("\\", "/"))
		.filter((file) => /(^|\/)move_[^/]+\.json$/.test(file));
}

describe("Hold stepper move data", () => {
	it("flags exactly the moves whose text grants hold", () => {
		const flagged = moveFiles()
			.filter((file) => moveHasHoldStepper(JSON.parse(readFileSync(join(PACKS_DIR, file), "utf8"))))
			.sort();

		expect(flagged).toEqual([
			"aegis-playbook-brain/move_Always_Prepared_PgmwFEYNbWB60UQW.json",
			"aegis-playbook-brain/move_Team_Move___Share_a_Vulnerability_qoliInbWxpMoDV3N.json",
			"aegis-playbook-soldier/move_Before_We_Get_Started_Lll1XpXdEwFqjDJE.json",
			"basic-playbook-bull/move_Team_Move___Share_a_Vulnerability_24nz9sda24XUt03B.json",
			"basic-playbook-bull/move_There_When_It_Matters_cAH622RTr42UH1nl.json",
			"basic-playbook-nova/move_Burn_85dJPVC2vJl9GBTq.json",
			"basic-playbook-outsider/move_Belong_in_Two_Worlds_qeaZKeGOGyHJKKr8.json"
		]);
	});
});
