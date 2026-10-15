import { describe, expect, it } from "vitest";
import { hideUngrantedConditions } from "../module/helpers/granted-conditions.mjs";

function buildConditions({ damagedValue = false } = {}) {
	return {
		options: {
			"0": { label: "Afraid (-2 to engage)", value: false },
			"5": { label: "Damaged (+1 to take a powerful blow)", value: damagedValue }
		}
	};
}

const damageMove = {
	type: "move",
	name: "Damage",
	flags: { "masks-newgeneration-unofficial": { grantsCondition: "Damaged" } }
};
const otherMove = { type: "move", name: "Some Other Move", flags: {} };

describe("hideUngrantedConditions", () => {
	it("keeps Damaged when a move grants it", () => {
		const conditions = buildConditions();

		hideUngrantedConditions(conditions, [otherMove, damageMove]);

		expect(conditions.options["5"]).toBeDefined();
	});

	it("removes Damaged when no move grants it, leaving the standard conditions alone", () => {
		const conditions = buildConditions();

		hideUngrantedConditions(conditions, [otherMove]);

		expect(conditions.options["5"]).toBeUndefined();
		expect(conditions.options["0"]).toBeDefined();
	});

	it("keeps a still-marked Damaged visible after the granting move is gone", () => {
		const conditions = buildConditions({ damagedValue: true });

		hideUngrantedConditions(conditions, []);

		expect(conditions.options["5"]).toBeDefined();
	});

	it("no-ops when the conditions attribute or its options are missing", () => {
		expect(() => hideUngrantedConditions(undefined, [damageMove])).not.toThrow();
		expect(() => hideUngrantedConditions({}, [damageMove])).not.toThrow();
	});

	it("no-ops on an actor whose conditions predate the Damaged option", () => {
		const conditions = { options: { "0": { label: "Afraid (-2 to engage)", value: false } } };

		hideUngrantedConditions(conditions, []);

		expect(Object.keys(conditions.options)).toEqual(["0"]);
	});
});
