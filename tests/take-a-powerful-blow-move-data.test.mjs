import { describe, expect, it } from "vitest";
import moveData from "../src/packs/moves/move_Take_a_Powerful_Blow_kLPw1b8IARpKEeXs.json";

describe("Take a Powerful Blow move data", () => {
	it("rolls the base formula directly instead of prompting for a manual modifier", () => {
		expect(moveData.system.rollType).toBe("formula");
		expect(moveData.system.rollFormula).toBe("2d6");
	});
});
