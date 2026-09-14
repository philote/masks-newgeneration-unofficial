import { describe, expect, it } from "vitest";
import moveData from "../src/packs/basic-playbook-nova/move_Burn_85dJPVC2vJl9GBTq.json";

describe("Burn move data", () => {
	it("rolls the base formula directly instead of prompting for a manual modifier", () => {
		expect(moveData.system.rollType).toBe("formula");
		expect(moveData.system.rollFormula).toBe("2d6");
	});
});
