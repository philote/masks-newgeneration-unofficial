import { beforeEach, describe, expect, it, vi } from "vitest";
import { initBasicMovePicker } from "../module/helpers/basic-move-picker.mjs";

function buildBasicMove(uuid, name) {
	return {
		uuid,
		name,
		system: {
			description: `<p>${name} description</p>`,
			choices: `<p>${name} choices</p>`,
			moveResults: { success: { value: `${name} success` } }
		}
	};
}

function buildItem({ flags = {}, name = "No Powers and Not Nearly Enough Training", originalRoll } = {}) {
	const item = {
		name,
		getFlag: (scope, key) => flags?.[scope]?.[key],
		clone: vi.fn((data, options) => ({ ...item, ...data, cloneOptions: options, roll: originalRoll })),
		roll: originalRoll
	};
	return item;
}

describe("initBasicMovePicker", () => {
	let originalRoll;

	beforeEach(() => {
		originalRoll = vi.fn().mockResolvedValue("rolled");
		vi.stubGlobal("CONFIG", { Item: { documentClass: { prototype: { roll: originalRoll } } } });
	});

	it("leaves items without the basicMoveChoices flag untouched", async () => {
		initBasicMovePicker();
		const item = buildItem();

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({});
	});

	it("bypasses the picker for descriptionOnly rolls even when the flag is present", async () => {
		initBasicMovePicker();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { basicMoveChoices: ["Compendium.x.moves.Item.a"] } }
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { descriptionOnly: true });

		expect(result).toBe("rolled");
		expect(originalRoll).toHaveBeenCalledWith({ descriptionOnly: true });
	});

	it("prompts for a basic move, clones the item with the chosen move's display data, and rolls the clone", async () => {
		const engage = buildBasicMove("Compendium.x.moves.Item.a", "Directly Engage a Threat");
		const unleash = buildBasicMove("Compendium.x.moves.Item.b", "Unleash Your Powers");
		vi.stubGlobal("fromUuid", vi.fn((uuid) => Promise.resolve([engage, unleash].find((m) => m.uuid === uuid))));
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue("1") } } }
		});

		initBasicMovePicker();
		const item = buildItem({
			flags: {
				"masks-newgeneration-unofficial": {
					basicMoveChoices: [engage.uuid, unleash.uuid]
				}
			},
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, { rollMode: "roll" });

		expect(foundry.applications.api.DialogV2.wait).toHaveBeenCalledWith(
			expect.objectContaining({
				classes: expect.arrayContaining(["themed", "theme-light"]),
				buttons: [expect.objectContaining({ action: "submit", class: "dialog-button" })]
			})
		);
		expect(item.clone).toHaveBeenCalledWith(
			{
				name: "No Powers and Not Nearly Enough Training (Unleash Your Powers)",
				"system.description": unleash.system.description,
				"system.choices": unleash.system.choices,
				"system.moveResults": unleash.system.moveResults
			},
			{ keepId: true }
		);
		expect(originalRoll).toHaveBeenCalledWith({ rollMode: "roll" });
		expect(result).toBe("rolled");
	});

	it("returns null and never rolls when the picker dialog is cancelled", async () => {
		const engage = buildBasicMove("Compendium.x.moves.Item.a", "Directly Engage a Threat");
		vi.stubGlobal("fromUuid", vi.fn().mockResolvedValue(engage));
		vi.stubGlobal("game", { i18n: { localize: (key) => key } });
		vi.stubGlobal("foundry", {
			applications: { api: { DialogV2: { wait: vi.fn().mockResolvedValue(null) } } }
		});

		initBasicMovePicker();
		const item = buildItem({
			flags: { "masks-newgeneration-unofficial": { basicMoveChoices: [engage.uuid] } },
			originalRoll
		});

		const result = await CONFIG.Item.documentClass.prototype.roll.call(item, {});

		expect(result).toBeNull();
		expect(item.clone).not.toHaveBeenCalled();
		expect(originalRoll).not.toHaveBeenCalled();
	});
});
