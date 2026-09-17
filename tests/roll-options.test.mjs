import { beforeEach, describe, expect, it, vi } from "vitest";
import { initRollOptions } from "../module/helpers/roll-options.mjs";

function buildItem({ flags = {}, name = "Connecting the Dots", actor, originalRoll } = {}) {
	const item = {
		name,
		actor,
		getFlag: (scope, key) => flags?.[scope]?.[key],
		clone: vi.fn((data, options) => ({ ...item, ...data, cloneOptions: options, roll: originalRoll })),
		roll: originalRoll
	};
	return item;
}

describe("initRollOptions", () => {
	let originalRoll;

	beforeEach(() => {
		originalRoll = vi.fn().mockResolvedValue("rolled");
		vi.stubGlobal("CONFIG", { Item: { documentClass: { prototype: { roll: originalRoll } } } });
	});

	it("leaves items without the rollOptions flag untouched", async () => {
		initRollOptions();
		const item = buildItem();

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	it("bypasses the picker for descriptionOnly rolls even when the flag is present", async () => {
		initRollOptions();
		const item = buildItem({
			flags: {
				"masks-newgeneration-unofficial": { rollOptions: [{ label: "A hero's cache", rollType: "savior" }] }
			}
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { descriptionOnly: true });

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({ descriptionOnly: true });
	});

	it("prompts for a roll option, clones the item with the chosen rollType, and rolls the clone", async () => {
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("1") } } }
		});

		initRollOptions();
		const rollOptions = [
			{ label: "A hero's cache", rollType: "savior" },
			{ label: "A villain's cache", rollType: "danger" }
		];
		const item = buildItem({
			name: "All the Best Stuff",
			flags: { "masks-newgeneration-unofficial": { rollOptions } },
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { rollMode: "roll" });

		expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalledWith(
			expect.objectContaining({
				window: { title: "MASKS-SHEETS.Dialog.ChooseRollTitle" },
				classes: expect.arrayContaining(["themed", "theme-light"]),
				buttons: [expect.objectContaining({ action: "submit", class: "dialog-button" })]
			})
		);
		expect(item.clone).toHaveBeenCalledWith(
			{
				name: "All the Best Stuff (A villain's cache)",
				"system.rollType": "danger"
			},
			{ keepId: true }
		);
		expect(originalRoll).toHaveBeenCalledWith({ rollMode: "roll" });
		expect(result).toBe("rolled");
	});

	it("resolves an attributeRollKey option into a formula rollType and computed rollFormula", async () => {
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("0") } } }
		});

		initRollOptions();
		const rollOptions = [{ label: "Remember someone's future self", attributeRollKey: "theHarbingerMemories" }];
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { rollOptions } },
			actor: { system: { attributes: { theHarbingerMemories: { value: 2 } } } },
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith(
			{
				name: "Connecting the Dots (Remember someone's future self)",
				"system.rollType": "formula",
				"system.rollFormula": "2d6 + 2"
			},
			{ keepId: true }
		);
	});

	it("passes the attributeRollResolver flag through to attributeRollFormula", async () => {
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("0") } } }
		});

		initRollOptions();
		const rollOptions = [
			{ label: "Draw on the group", attributeRollKey: "theReformed", attributeRollResolver: "highestCheckedCount" }
		];
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { rollOptions } },
			actor: {
				system: {
					attributes: {
						theReformed: { options: { 0: { values: { 0: { value: true }, 1: { value: true } } } } }
					}
				}
			},
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith(
			{
				name: "Connecting the Dots (Draw on the group)",
				"system.rollType": "formula",
				"system.rollFormula": "2d6 + 2"
			},
			{ keepId: true }
		);
	});

	it("includes moveResults in the clone data when the chosen option carries it", async () => {
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("0") } } }
		});

		initRollOptions();
		const moveResults = { success: { key: "data.moveResults.success.value", label: "Success!", value: "<p>Yes</p>" } };
		const rollOptions = [{ label: "Investigate the timeline", rollType: "savior", moveResults }];
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { rollOptions } },
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(item.clone).toHaveBeenCalledWith(
			{
				name: "Connecting the Dots (Investigate the timeline)",
				"system.rollType": "savior",
				"system.moveResults": moveResults
			},
			{ keepId: true }
		);
	});

	it("omits system.moveResults from the clone data when the chosen option has none", async () => {
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("0") } } }
		});

		initRollOptions();
		const rollOptions = [{ label: "A hero's cache", rollType: "savior" }];
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { rollOptions } },
			originalRoll
		});

		await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		const cloneData = item.clone.mock.calls[0][0];
		expect(cloneData).not.toHaveProperty(["system.moveResults"]);
	});

	it("returns null and never rolls when the picker dialog is cancelled", async () => {
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue(null) } } }
		});

		initRollOptions();
		const rollOptions = [{ label: "A hero's cache", rollType: "savior" }];
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { rollOptions } },
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBeNull();
		expect(item.clone).not.toHaveBeenCalled();
		expect(originalRoll).not.toHaveBeenCalled();
	});
});
