import { describe, expect, it, vi } from "vitest";
import { MasksActorSheetMixin } from "../module/sheets/actor-sheet.mjs";

const CUSTOM_PLAYBOOK = { name: "Custom", uuid: "Compendium.masks-newgeneration-unofficial.custom-playbook.Item.lpBBC1uT1iFGbwXs" };
const BEACON_PLAYBOOK = { name: "The Beacon", uuid: "Compendium.masks-newgeneration-unofficial.basic-playbook-beacon.Item.0iryK44tVpbXhlMF" };

class BaseSheet {
	constructor(items, system = {}) {
		this.actor = { items, system };
	}

	async getData() {
		return { playbooks: [CUSTOM_PLAYBOOK, BEACON_PLAYBOOK] };
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

describe("MasksActorSheet.getData", () => {
	function stubAllowCustomPlaybooks(allowed) {
		vi.stubGlobal("game", { settings: { get: vi.fn().mockReturnValue(allowed) } });
	}

	it("hides the Custom playbook from the dropdown when custom playbooks aren't allowed", async () => {
		stubAllowCustomPlaybooks(false);

		const context = await new MasksSheet([]).getData();

		expect(context.playbooks).toEqual([BEACON_PLAYBOOK]);
	});

	it("lists the Custom playbook when custom playbooks are allowed", async () => {
		stubAllowCustomPlaybooks(true);

		const context = await new MasksSheet([]).getData();

		expect(context.playbooks).toEqual([CUSTOM_PLAYBOOK, BEACON_PLAYBOOK]);
	});

	it("keeps the Custom playbook listed for an actor already using it", async () => {
		stubAllowCustomPlaybooks(false);

		const context = await new MasksSheet([], { playbook: { uuid: CUSTOM_PLAYBOOK.uuid } }).getData();

		expect(context.playbooks).toEqual([CUSTOM_PLAYBOOK, BEACON_PLAYBOOK]);
	});
});
