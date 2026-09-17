import { beforeEach, describe, expect, it, vi } from "vitest";
import { initLabelSwap } from "../module/helpers/label-swap.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";

function buildSwapSourceItem(labelSwap) {
	return { getFlag: (scope, key) => (scope === MODULE_ID && key === "labelSwap" ? labelSwap : undefined) };
}

function buildActor({ items = [], stats = {}, attributes = {} } = {}) {
	return { items, system: { stats, attributes } };
}

function buildItem({
	actor,
	flags = {},
	name = "Directly Engage a Threat",
	moveType = "basic",
	rollType = "danger",
	choices = "<p>existing choices</p>",
	originalRoll
} = {}) {
	const item = {
		name,
		actor,
		system: { moveType, rollType, choices },
		getFlag: (scope, key) => flags?.[scope]?.[key],
		clone: vi.fn((data, options) => ({ ...item, ...data, cloneOptions: options, roll: originalRoll })),
		roll: originalRoll
	};
	return item;
}

describe("initLabelSwap", () => {
	let originalRoll;

	beforeEach(() => {
		originalRoll = vi.fn().mockResolvedValue("rolled");
		vi.stubGlobal("CONFIG", { Item: { documentClass: { prototype: { roll: originalRoll } } } });
		vi.stubGlobal("game", { i18n: { localize: (key) => key, format: (key, data) => `${key} ${JSON.stringify(data)}` } });
	});

	it("bypasses the swap for descriptionOnly rolls", async () => {
		const actor = buildActor({ items: [buildSwapSourceItem({ attributeKey: "theSoldier", moveTypes: ["basic"] })] });
		initLabelSwap();
		const item = buildItem({ actor, originalRoll });

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { descriptionOnly: true });

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({ descriptionOnly: true });
		expect(item.clone).not.toHaveBeenCalled();
	});

	it("bypasses the swap when the item has no actor", async () => {
		initLabelSwap();
		const item = buildItem({ actor: undefined, originalRoll });

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	it("bypasses the swap when no actor item carries the labelSwap flag", async () => {
		const actor = buildActor({ items: [{ getFlag: () => undefined }] });
		initLabelSwap();
		const item = buildItem({ actor, originalRoll });

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	it("bypasses the swap when the rolling move's moveType isn't covered", async () => {
		const actor = buildActor({
			items: [buildSwapSourceItem({ attributeKey: "theSoldier", moveTypes: ["playbook"] })]
		});
		initLabelSwap();
		const item = buildItem({ actor, moveType: "basic", rollType: "danger", originalRoll });

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	it("bypasses the swap for a formula rollType", async () => {
		const actor = buildActor({
			items: [buildSwapSourceItem({ attributeKey: "theSoldier", moveTypes: ["basic", "playbook"] })]
		});
		initLabelSwap();
		const item = buildItem({ actor, moveType: "playbook", rollType: "formula", originalRoll });

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	describe("when eligible", () => {
		function buildEligibleActor(rollTypeStat = { label: "Danger", value: -1 }) {
			return buildActor({
				items: [
					buildSwapSourceItem({
						attributeKey: "theSoldier",
						moveTypes: ["basic", "playbook"],
						reminderText: "Give A.E.G.I.S. Influence over you."
					})
				],
				stats: { danger: rollTypeStat },
				attributes: { theSoldier: { label: "Soldier", value: 2 } }
			});
		}

		it("choosing normal rolls the original item unchanged, without cloning", async () => {
			vi.stubGlobal("foundry", {
				applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("normal") } } }
			});
			const actor = buildEligibleActor();
			initLabelSwap();
			const item = buildItem({ actor, moveType: "basic", rollType: "danger", originalRoll });

			const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { rollMode: "roll" });

			expect(item.clone).not.toHaveBeenCalled();
			expect(originalRoll).toHaveBeenCalledWith({ rollMode: "roll" });
			expect(originalRoll.mock.instances[0]).toBe(item);
			expect(result).toBe("rolled");
		});

		it("choosing swap on a core-stat move clones with the Soldier formula and reminder text, keeping the same name", async () => {
			vi.stubGlobal("foundry", {
				applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("swap") } } }
			});
			const actor = buildEligibleActor();
			initLabelSwap();
			const item = buildItem({
				actor,
				moveType: "basic",
				rollType: "danger",
				choices: "<p>existing choices</p>",
				originalRoll
			});

			const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

			expect(item.clone).toHaveBeenCalledWith(
				{
					"system.rollType": "formula",
					"system.rollFormula": "2d6 + 2",
					"system.choices": "<p>Give A.E.G.I.S. Influence over you.</p><p>existing choices</p>"
				},
				{ keepId: true }
			);
			const cloneData = item.clone.mock.calls[0][0];
			expect(cloneData).not.toHaveProperty("name");
			expect(originalRoll).toHaveBeenCalledWith({});
			expect(result).toBe("rolled");
		});

		it("choosing swap on an 'ask' move produces the same clone shape", async () => {
			vi.stubGlobal("foundry", {
				applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("swap") } } }
			});
			const actor = buildEligibleActor();
			initLabelSwap();
			const item = buildItem({
				actor,
				moveType: "playbook",
				rollType: "ask",
				choices: "<p>existing choices</p>",
				originalRoll
			});

			await CONFIG.Item.documentClass.prototype.roll.call(item, {});

			expect(item.clone).toHaveBeenCalledWith(
				{
					"system.rollType": "formula",
					"system.rollFormula": "2d6 + 2",
					"system.choices": "<p>Give A.E.G.I.S. Influence over you.</p><p>existing choices</p>"
				},
				{ keepId: true }
			);
			expect(item.clone.mock.calls[0][0]).not.toHaveProperty("name");
		});

		it("returns null and never rolls or clones when the dialog is cancelled", async () => {
			vi.stubGlobal("foundry", {
				applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue(null) } } }
			});
			const actor = buildEligibleActor();
			initLabelSwap();
			const item = buildItem({ actor, moveType: "basic", rollType: "danger", originalRoll });

			const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

			expect(result).toBeNull();
			expect(item.clone).not.toHaveBeenCalled();
			expect(originalRoll).not.toHaveBeenCalled();
		});

		it("omits system.choices from the clone when reminderText is absent", async () => {
			vi.stubGlobal("foundry", {
				applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("swap") } } }
			});
			const actor = buildActor({
				items: [buildSwapSourceItem({ attributeKey: "theSoldier", moveTypes: ["basic", "playbook"] })],
				stats: { danger: { label: "Danger", value: -1 } },
				attributes: { theSoldier: { label: "Soldier", value: 2 } }
			});
			initLabelSwap();
			const item = buildItem({ actor, moveType: "basic", rollType: "danger", originalRoll });

			await CONFIG.Item.documentClass.prototype.roll.call(item, {});

			expect(item.clone).toHaveBeenCalledWith(
				{
					"system.rollType": "formula",
					"system.rollFormula": "2d6 + 2"
				},
				{ keepId: true }
			);
			expect(item.clone.mock.calls[0][0]).not.toHaveProperty("system.choices");
		});
	});
});
