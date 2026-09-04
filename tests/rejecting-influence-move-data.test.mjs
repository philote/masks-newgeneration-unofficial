import { describe, expect, it } from "vitest";
import moveData from "../src/packs/moves/move_Rejecting_Influence_seVDkWcE3goK3amK.json";

describe("Rejecting Influence move data", () => {
	it("rolls the base formula directly instead of prompting for a manual modifier", () => {
		expect(moveData.system.rollType).toBe("formula");
		expect(moveData.system.rollFormula).toBe("2d6");
	});
});
