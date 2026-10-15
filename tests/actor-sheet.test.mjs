import { describe, expect, it } from "vitest";
import { MasksActorSheetMixin } from "../module/sheets/actor-sheet.mjs";

class BaseSheet {
	constructor(items) {
		this.actor = { items };
	}

	async _prepareAttrs(context) {
		context.system.attrLeft = {
			conditions: {
				options: {
					"0": { label: "Afraid (-2 to engage)", value: false },
					"5": { label: "Damaged (+1 to take a powerful blow)", value: false }
				}
			}
		};
	}
}

const MasksSheet = MasksActorSheetMixin(BaseSheet);

describe("MasksActorSheet._prepareAttrs", () => {
	it("hides Damaged for an actor without a move granting it", async () => {
		const context = { system: {} };

		await new MasksSheet([])._prepareAttrs(context);

		expect(context.system.attrLeft.conditions.options["5"]).toBeUndefined();
		expect(context.system.attrLeft.conditions.options["0"]).toBeDefined();
	});

	it("shows Damaged for an actor with the Damage move", async () => {
		const context = { system: {} };
		const damageMove = {
			type: "move",
			name: "Damage",
			flags: { "masks-newgeneration-unofficial": { grantsCondition: "Damaged" } }
		};

		await new MasksSheet([damageMove])._prepareAttrs(context);

		expect(context.system.attrLeft.conditions.options["5"]).toBeDefined();
	});
});
