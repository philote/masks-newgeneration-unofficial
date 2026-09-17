import { describe, expect, it } from "vitest";
import moveData from "../src/packs/hchc-playbooks-reformed/move_Friends_in_Low_Places_zgT2HTOZKOiKXC6T.json";

describe("Friends in Low Places move data", () => {
	it("rolls a formula seeded from the highest obligation attribute", () => {
		expect(moveData.system.rollType).toBe("formula");
		expect(moveData.system.rollFormula).toBe("2d6");
	});

	it("opts into the generic attribute-roll mechanism for the obligation checkbox grid", () => {
		const flags = moveData.flags["masks-newgeneration-unofficial"];
		expect(flags.attributeRollKey).toBe("theReformed");
		expect(flags.attributeRollResolver).toBe("highestCheckedCount");
	});
});
