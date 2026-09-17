import { beforeEach, describe, expect, it, vi } from "vitest";
import { attributeRollFormula, initAttributeRoll } from "../module/helpers/attribute-roll.mjs";

function buildItem({ flags = {}, actor, originalRoll } = {}) {
	const item = {
		actor,
		getFlag: (scope, key) => flags?.[scope]?.[key],
		clone: vi.fn((data, options) => ({ ...item, ...data, cloneOptions: options, roll: originalRoll })),
		roll: originalRoll
	};
	return item;
}

function buildActor(attributes) {
	return { system: { attributes } };
}

describe("initAttributeRoll", () => {
	let originalRoll;

	beforeEach(() => {
		originalRoll = vi.fn().mockResolvedValue("rolled");
		vi.stubGlobal("CONFIG", { Item: { documentClass: { prototype: { roll: originalRoll } } } });
	});

	it("leaves items without the attributeRollKey flag untouched", async () => {
		initAttributeRoll();
		const item = buildItem({ actor: buildActor({ theSoldier: { value: 2 } }) });

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	it("leaves world items with no owning actor untouched", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } },
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(item.clone).not.toHaveBeenCalled();
	});

	it("bypasses the formula rewrite for descriptionOnly rolls even when the flag is present", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } },
			actor: buildActor({ theSoldier: { value: 2 } }),
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { descriptionOnly: true });

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({ descriptionOnly: true });
	});

	it("bakes a positive attribute value into the clone's roll formula", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } },
			actor: buildActor({ theSoldier: { value: 2 } }),
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { rollMode: "roll" });

		expect(item.clone).toHaveBeenCalledWith({ "system.rollFormula": "2d6 + 2" }, { keepId: true });
		expect(originalRoll).toHaveBeenCalledWith({ rollMode: "roll" });
		expect(result).toBe("rolled");
	});

	it("bakes a negative attribute value into the clone's roll formula", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } },
			actor: buildActor({ theSoldier: { value: -1 } }),
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith({ "system.rollFormula": "2d6 - 1" }, { keepId: true });
	});

	it("treats a missing attribute value as 0", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } },
			actor: buildActor({}),
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith({ "system.rollFormula": "2d6 + 0" }, { keepId: true });
	});
});

function buildListManyAttribute(optionsCheckedCounts) {
	const options = {};
	optionsCheckedCounts.forEach((checkedCount, optionIndex) => {
		const values = {};
		for (let i = 0; i < checkedCount; i++) {
			values[i] = { value: true };
		}
		values[checkedCount] = { value: false };
		options[optionIndex] = { label: `Option ${optionIndex}`, value: false, values };
	});
	return { options };
}

describe("attributeRollFormula", () => {
	it("uses the highestCheckedCount resolver to pick the max checked count across options", () => {
		const actor = buildActor({ theReformed: buildListManyAttribute([2, 0, 1]) });

		const formula = attributeRollFormula(actor, "theReformed", "highestCheckedCount");

		expect(formula).toBe("2d6 + 2");
	});

	it("returns 2d6 + 0 for an attribute with no options under the highestCheckedCount resolver", () => {
		const actor = buildActor({ theReformed: { options: {} } });

		const formula = attributeRollFormula(actor, "theReformed", "highestCheckedCount");

		expect(formula).toBe("2d6 + 0");
	});

	it("returns 2d6 + 0 when options exist but nothing is checked", () => {
		const actor = buildActor({ theReformed: buildListManyAttribute([0, 0]) });

		const formula = attributeRollFormula(actor, "theReformed", "highestCheckedCount");

		expect(formula).toBe("2d6 + 0");
	});

	it("falls back to the value resolver for an unknown resolver name", () => {
		const actor = buildActor({ theSoldier: { value: 3 } });

		const formula = attributeRollFormula(actor, "theSoldier", "notARealResolver");

		expect(formula).toBe("2d6 + 3");
	});
});

describe("initAttributeRoll with attributeRollResolver", () => {
	let originalRoll;

	beforeEach(() => {
		originalRoll = vi.fn().mockResolvedValue("rolled");
		vi.stubGlobal("CONFIG", { Item: { documentClass: { prototype: { roll: originalRoll } } } });
	});

	it("uses the attributeRollResolver flag to resolve a ListMany-style attribute", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: {
				"masks-newgeneration-unofficial": {
					attributeRollKey: "theReformed",
					attributeRollResolver: "highestCheckedCount"
				}
			},
			actor: buildActor({ theReformed: buildListManyAttribute([2, 0, 1]) }),
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith({ "system.rollFormula": "2d6 + 2" }, { keepId: true });
	});

	it("defaults to the value resolver when attributeRollResolver is absent", async () => {
		initAttributeRoll();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } },
			actor: buildActor({ theSoldier: { value: 4 } }),
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith({ "system.rollFormula": "2d6 + 4" }, { keepId: true });
	});
});
