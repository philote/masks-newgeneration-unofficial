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

	async _prepareItems() {}

	activateListeners() {}
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

describe("MasksActorSheet._prepareItems", () => {
	it("gives a hold-stepper move its stored hold, and leaves other moves alone", async () => {
		const burn = { _id: "burn", flags: { "masks-newgeneration-unofficial": { holdStepper: true, hold: 2 } } };
		const assess = { _id: "assess", flags: {} };
		const context = { moves: { playbook: [burn], basic: [assess] } };

		await new MasksSheet([])._prepareItems(context);

		expect(burn.masksHold).toEqual({ value: 2 });
		expect(assess.masksHold).toBeUndefined();
	});
});

describe("MasksActorSheet.activateListeners", () => {
	function renderHoldStepper(editable) {
		const root = document.createElement("div");
		root.innerHTML = `
			<li class="item" data-item-id="burn">
				<div class="masks-move-hold">
					<button type="button" class="masks-move-hold__control" data-hold-action="decrease">-</button>
					<input type="number" class="masks-move-hold__input" value="2"/>
					<button type="button" class="masks-move-hold__control" data-hold-action="increase">+</button>
				</div>
			</li>`;

		const burn = {
			flags: { "masks-newgeneration-unofficial": { holdStepper: true, hold: 2 } },
			setFlag: vi.fn().mockResolvedValue(undefined)
		};
		const sheet = new MasksSheet([]);
		sheet.actor.items = { get: (id) => (id === "burn" ? burn : undefined) };
		sheet.isEditable = editable;
		sheet.activateListeners([root]);

		return { root, burn };
	}

	it("steps the move's hold from the -/+ buttons", () => {
		const { root, burn } = renderHoldStepper(true);

		root.querySelector('[data-hold-action="increase"]').click();
		root.querySelector('[data-hold-action="decrease"]').click();

		expect(burn.setFlag).toHaveBeenNthCalledWith(1, "masks-newgeneration-unofficial", "hold", 3);
		expect(burn.setFlag).toHaveBeenNthCalledWith(2, "masks-newgeneration-unofficial", "hold", 1);
	});

	it("stores a typed hold without letting the change reach the actor form", () => {
		const { root, burn } = renderHoldStepper(true);
		const formListener = vi.fn();
		root.addEventListener("change", formListener);

		const input = root.querySelector(".masks-move-hold__input");
		input.value = "5";
		input.dispatchEvent(new Event("change", { bubbles: true }));

		expect(burn.setFlag).toHaveBeenCalledWith("masks-newgeneration-unofficial", "hold", 5);
		expect(formListener).not.toHaveBeenCalled();
	});

	it("binds nothing on a sheet the user can't edit", () => {
		const { root, burn } = renderHoldStepper(false);

		root.querySelector('[data-hold-action="increase"]').click();
		const input = root.querySelector(".masks-move-hold__input");
		input.value = "5";
		input.dispatchEvent(new Event("change", { bubbles: true }));

		expect(burn.setFlag).not.toHaveBeenCalled();
	});
});
