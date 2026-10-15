import { beforeEach, describe, expect, it } from "vitest";
import {
	applyRollBonus,
	availableBonuses,
	baseModifier,
	findLatestRoll,
	isBonusRollMessage,
	nextBonusState
} from "../module/helpers/roll-bonuses-utils.mjs";
import { FakeRoll, NumericTerm, OperatorTerm, buildActor, buildMessage, stubRollGlobals } from "./roll-bonuses-fixtures.mjs";

beforeEach(() => {
	stubRollGlobals();
});

function actions(bonuses) {
	return bonuses.map((b) => b.action);
}

describe("baseModifier", () => {
	it("sums signed flat modifiers and ignores the dice", () => {
		expect(baseModifier(new FakeRoll({ mods: [2, -2, 1] }))).toBe(1);
	});

	it("ignores pbta's GM roll-shift terms and this module's own bonus terms", () => {
		const roll = new FakeRoll({ mods: [2] });
		roll.terms.push(
			new OperatorTerm({ operator: "-", options: { rollShifting: true } }),
			new NumericTerm({ number: 1, options: { rollShifting: true } }),
			new OperatorTerm({ operator: "+", options: { masksBonus: true } }),
			new NumericTerm({ number: 1, options: { masksBonus: true } })
		);

		expect(baseModifier(roll)).toBe(2);
	});
});

describe("applyRollBonus", () => {
	it("adds the bonus to the total, records the condition, and re-evaluates", async () => {
		const roll = new FakeRoll({ dice: 6, mods: [1] });

		await applyRollBonus(roll, 1, "Forward (+1)");

		expect(roll.total).toBe(8);
		expect(roll.options.conditions).toEqual(["Forward (+1)"]);
		expect(roll.resetFormula).toHaveBeenCalled();
		expect(roll.options.originalMod).toBeUndefined();
	});

	it("accumulates repeated bonuses into a single tagged term", async () => {
		const roll = new FakeRoll({ dice: 6, mods: [0] });

		await applyRollBonus(roll, 1, "Forward (+1)");
		await applyRollBonus(roll, 1, "Forward (+1)");
		await applyRollBonus(roll, 1, "Influence (+1)");

		expect(roll.total).toBe(9);
		expect(roll.terms.filter((t) => t.options.masksBonus)).toHaveLength(2);
		expect(roll.options.conditions).toHaveLength(3);
	});

	it("respects the sheetConfig max modifier and reports the uncapped value", async () => {
		const roll = new FakeRoll({ dice: 5, mods: [3] });

		await applyRollBonus(roll, 1, "Forward (+1)");
		expect(roll.total).toBe(9);
		await applyRollBonus(roll, 1, "Ongoing (+1)");

		expect(roll.total).toBe(9);
		expect(roll.options.originalMod).toBe(5);
	});

	it("builds on pbta's own uncapped originalMod when the roll was already capped", async () => {
		const roll = new FakeRoll({ dice: 5, mods: [4], options: { originalMod: 5 } });

		await applyRollBonus(roll, 1, "Forward (+1)");

		expect(roll.total).toBe(9);
		expect(roll.options.originalMod).toBe(6);
	});

	it("clears originalMod once a bonus lifts a below-minimum roll back into range", async () => {
		const roll = new FakeRoll({ dice: 7, mods: [-3], options: { originalMod: -4 } });

		await applyRollBonus(roll, 1, "Forward (+1)");

		expect(roll.total).toBe(4);
		expect(roll.options.originalMod).toBeUndefined();
	});
});

describe("availableBonuses", () => {
	it("always offers Use Influence, even with no forward, ongoing, or Influence list entries", () => {
		expect(availableBonuses(buildActor())).toEqual([{ action: "influence", amount: 1 }]);
	});

	it("keeps offering forward while any remains, regardless of how many were used", () => {
		const actor = buildActor({ forward: 1 });
		expect(actions(availableBonuses(actor, { forwardUsed: 2 }))).toContain("forward");
		expect(actions(availableBonuses(buildActor({ forward: 0 })))).not.toContain("forward");
	});

	it("offers ongoing +1 at a time, until this roll has used as much as the actor has", () => {
		const actor = buildActor({ ongoing: 3 });
		expect(availableBonuses(actor)).toContainEqual({ action: "ongoing", amount: 1 });
		expect(availableBonuses(actor, { ongoingUsed: 2 })).toContainEqual({ action: "ongoing", amount: 1 });
		expect(actions(availableBonuses(actor, { ongoingUsed: 3 }))).not.toContain("ongoing");
	});

	it("doesn't name or depend on the sheet's Influence list", () => {
		const actor = buildActor({
			influences: [
				{ id: "a", name: "Jonas", haveInfluenceOver: true },
				{ id: "b", name: "Mom", haveInfluenceOver: true }
			]
		});

		expect(availableBonuses(actor)).toEqual([{ action: "influence", amount: 1 }]);
	});

	it("swaps Use Influence for Exploit Influence once used, then offers neither once exploited", () => {
		const actor = buildActor();

		expect(availableBonuses(actor, { influenceUsed: true })).toEqual([{ action: "exploit", amount: 1 }]);
		expect(availableBonuses(actor, { influenceUsed: true, influenceExploited: true })).toEqual([]);
	});
});

describe("nextBonusState", () => {
	it("tracks each kind of spent bonus", () => {
		let state = nextBonusState({}, { action: "forward" });
		state = nextBonusState(state, { action: "forward" });
		state = nextBonusState(state, { action: "ongoing" });
		state = nextBonusState(state, { action: "ongoing" });
		state = nextBonusState(state, { action: "influence" });
		state = nextBonusState(state, { action: "exploit" });

		expect(state).toEqual({
			forwardUsed: 2,
			ongoingUsed: 2,
			influenceUsed: true,
			influenceExploited: true
		});
	});
});

describe("isBonusRollMessage", () => {
	it("accepts a RollPbtA roll card", () => {
		expect(isBonusRollMessage(buildMessage())).toBe(true);
	});

	it("rejects messages without a roll, non-pbta rolls, and description-only rolls", () => {
		expect(isBonusRollMessage(buildMessage({ roll: null }))).toBe(false);
		expect(isBonusRollMessage(buildMessage({ roll: { options: {} } }))).toBe(false);
		expect(isBonusRollMessage(buildMessage({ roll: new FakeRoll({ options: { descriptionOnly: true } }) }))).toBe(false);
	});
});

describe("findLatestRoll", () => {
	it("returns the actor's newest roll card, skipping other actors and non-roll messages", () => {
		const first = buildMessage({ id: "1" });
		const latest = buildMessage({ id: "2" });
		const messages = [first, latest, buildMessage({ id: "3", actorId: "other" }), buildMessage({ id: "4", roll: null })];

		expect(findLatestRoll(messages, "actor1")).toBe(latest);
		expect(findLatestRoll(messages, "actor1", "2")).toBe(first);
		expect(findLatestRoll(messages, "nobody")).toBeNull();
	});
});
