import { describe, expect, it } from "vitest";
import moveData from "../src/packs/hchc-playbooks-newborn/move_Damage_2RzWo1lB4JvpEHwj.json";
import { GRANTED_CONDITION_OPTION_KEYS } from "../module/helpers/granted-conditions.mjs";

describe("Damage move data", () => {
	it("grants the Damaged condition", () => {
		const granted = moveData.flags["masks-newgeneration-unofficial"].grantsCondition;
		expect(granted).toBe("Damaged");
		expect(GRANTED_CONDITION_OPTION_KEYS).toHaveProperty(granted);
	});
});
