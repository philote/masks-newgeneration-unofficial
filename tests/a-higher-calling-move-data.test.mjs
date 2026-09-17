import { describe, expect, it } from "vitest";
import moveData from "../src/packs/aegis-playbook-soldier/move_A_Higher_Calling_148GpsSskloolq8C.json";

describe("A Higher Calling move data", () => {
	it("rolls 2d6 as a formula roll instead of prompting for one of the 5 core stats", () => {
		expect(moveData.system.rollType).toBe("formula");
		expect(moveData.system.rollFormula).toBe("2d6");
	});

	it("flags the Soldier Label as the attribute to roll with", () => {
		expect(moveData.flags["masks-newgeneration-unofficial"].attributeRollKey).toBe("theSoldier");
	});

	it("flags the labelSwap rule so other basic/playbook moves can roll with Soldier instead", () => {
		expect(moveData.flags["masks-newgeneration-unofficial"].labelSwap).toEqual({
			attributeKey: "theSoldier",
			moveTypes: ["basic", "playbook"],
			reminderText: "Give A.E.G.I.S. Influence over you."
		});
	});
});
