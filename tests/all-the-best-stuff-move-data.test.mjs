import { describe, expect, it } from "vitest";
import moveData from "../src/packs/unbound-playbook-scion/move_All_the_Best_Stuff_lAPeonZjgWpNThTz.json";

describe("All the Best Stuff move data", () => {
	it("falls back to pbta's own stat picker if the rollOptions flag is ever absent", () => {
		expect(moveData.system.rollType).toBe("ask");
	});

	it("lists the two caches it can stand in for, so the roll picker has something to offer", () => {
		expect(moveData.flags["masks-newgeneration-unofficial"].rollOptions).toEqual([
			{ label: "A hero's cache", rollType: "savior" },
			{ label: "A villain's cache", rollType: "danger" }
		]);
	});
});
