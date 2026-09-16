import { beforeEach, describe, expect, it, vi } from "vitest";
import { initSkipEmptyRollDialog } from "../module/helpers/skip-empty-roll-dialog.mjs";

function formatMock(key, data) {
	return `${key}:${JSON.stringify(data ?? {})}`;
}

// Mirrors the real EVALUATION_TEMPLATE's .cell--conditions markup (same shape the
// basic-move-conditions.test.mjs / powerful-blow.test.mjs fixtures use), rendered
// to a string the way foundry.applications.handlebars.renderTemplate would.
function renderConditionsHtml(conditions) {
	const root = document.createElement("form");
	const cell = document.createElement("div");
	cell.className = "cell cell--conditions";

	const notes = document.createElement("p");
	notes.className = "notes";
	notes.textContent = "Choose all conditional modifiers that apply:";
	cell.appendChild(notes);

	const list = document.createElement("ul");
	for (const condition of conditions) {
		const li = document.createElement("li");
		const label = document.createElement("label");
		const input = document.createElement("input");
		input.type = "checkbox";
		input.name = "condition";
		input.dataset.mod = String(condition.mod);
		input.dataset.content = condition.label;
		label.appendChild(input);
		li.appendChild(label);
		list.appendChild(li);
	}
	cell.appendChild(list);
	root.appendChild(cell);
	return root.outerHTML;
}

// Minimal stand-in for pbta's real RollPbtA.prototype._onDialogSubmit: sums the
// mod of every checked (or force-checked+disabled) condition checkbox in the
// container it's handed. Good enough to prove this module's shim wires a correctly
// locked-down container through to the real submit path — the actual dice-term
// math is pbta's own, already-relied-upon code, not something this module owns.
function fakeOnDialogSubmit(html) {
	const form = html[0].querySelector("form") ?? html[0];
	const checked = Array.from(form.querySelectorAll('input[name="condition"]')).filter((c) => c.checked);
	let appliedMod = 0;
	for (const checkbox of checked) {
		appliedMod += Number(checkbox.dataset.mod);
		this.options.conditions.push(checkbox.dataset.content);
	}
	return { appliedMod, conditions: this.options.conditions };
}

function buildRoll({ conditionGroups = [], resources, rollType } = {}) {
	return {
		data: { conditionGroups, resources, rollType },
		options: {},
		constructor: { EVALUATION_TEMPLATE: "systems/pbta/templates/chat/roll-dialog.html" },
		_onDialogSubmit: vi.fn(fakeOnDialogSubmit)
	};
}

const NO_MODS_RESOURCES = { forward: { value: 0 }, ongoing: { value: 0 }, hold: { value: 0 } };

describe("initSkipEmptyRollDialog", () => {
	let originalConfigureDialog;
	let renderTemplate;

	beforeEach(() => {
		originalConfigureDialog = vi.fn().mockResolvedValue("dialog result");
		vi.stubGlobal("CONFIG", { Dice: { RollPbtA: { prototype: { configureDialog: originalConfigureDialog } } } });
		vi.stubGlobal("game", { i18n: { format: vi.fn(formatMock), localize: vi.fn((key) => key) } });
		vi.stubGlobal("foundry", {
			utils: { mergeObject: (a, b) => ({ ...a, ...b }) },
			applications: { handlebars: { renderTemplate: vi.fn() } }
		});
		renderTemplate = foundry.applications.handlebars.renderTemplate;
		initSkipEmptyRollDialog();
	});

	describe("real choices remain — delegates to the original untouched", () => {
		it("rollType \"ask\"", async () => {
			const roll = buildRoll({ conditionGroups: ["Angry"], rollType: "ask" });

			const result = await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(roll, { title: "Move" }, {});

			expect(originalConfigureDialog).toHaveBeenCalledWith({ title: "Move" }, {});
			expect(result).toBe("dialog result");
			expect(renderTemplate).not.toHaveBeenCalled();
			expect(roll._onDialogSubmit).not.toHaveBeenCalled();
		});

		it("rollType \"prompt\"", async () => {
			const roll = buildRoll({ conditionGroups: ["Angry"], rollType: "prompt" });

			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(roll, { title: "Move" }, {});

			expect(originalConfigureDialog).toHaveBeenCalled();
			expect(roll._onDialogSubmit).not.toHaveBeenCalled();
		});

		it("banked forward", async () => {
			const roll = buildRoll({
				conditionGroups: [],
				rollType: "danger",
				resources: { forward: { value: 1 }, ongoing: { value: 0 }, hold: { value: 0 } }
			});

			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(roll, {}, {});

			expect(originalConfigureDialog).toHaveBeenCalled();
			expect(roll._onDialogSubmit).not.toHaveBeenCalled();
		});

		it("banked ongoing or hold", async () => {
			const ongoing = buildRoll({
				rollType: "danger",
				resources: { forward: { value: 0 }, ongoing: { value: 1 }, hold: { value: 0 } }
			});
			const hold = buildRoll({
				rollType: "danger",
				resources: { forward: { value: 0 }, ongoing: { value: 0 }, hold: { value: 1 } }
			});

			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(ongoing, {}, {});
			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(hold, {}, {});

			expect(ongoing._onDialogSubmit).not.toHaveBeenCalled();
			expect(hold._onDialogSubmit).not.toHaveBeenCalled();
		});

		it("stat-token spend available", async () => {
			const roll = buildRoll({ conditionGroups: [], rollType: "danger", resources: NO_MODS_RESOURCES });

			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(
				roll,
				{ templateData: { isStatToken: true, numOfToken: 3 } },
				{}
			);

			expect(originalConfigureDialog).toHaveBeenCalled();
			expect(roll._onDialogSubmit).not.toHaveBeenCalled();
		});

		it("no marked conditions at all — pbta's own native no-dialog case", async () => {
			const roll = buildRoll({ conditionGroups: [], rollType: "danger", resources: NO_MODS_RESOURCES });

			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(roll, {}, {});

			expect(originalConfigureDialog).toHaveBeenCalled();
			expect(roll._onDialogSubmit).not.toHaveBeenCalled();
		});
	});

	describe("conditions are the only trigger — skips the dialog", () => {
		it("resolves via the real condition-lockdown hooks and _onDialogSubmit, applying the matched condition's mod", async () => {
			renderTemplate.mockResolvedValue(
				renderConditionsHtml([{ label: "Angry (-2 to comfort or pierce)", mod: -2 }])
			);
			const roll = buildRoll({
				conditionGroups: ["Angry"],
				rollType: "mundane",
				resources: NO_MODS_RESOURCES
			});

			const result = await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(
				roll,
				{ title: "Comfort or Support" },
				{}
			);

			expect(originalConfigureDialog).not.toHaveBeenCalled();
			expect(renderTemplate).toHaveBeenCalledWith(
				"systems/pbta/templates/chat/roll-dialog.html",
				expect.objectContaining({ conditionGroups: ["Angry"], hasPrompt: false, hasSituationalMods: false })
			);
			expect(roll.options.title).toBe("Comfort or Support");
			expect(roll._onDialogSubmit).toHaveBeenCalledTimes(1);
			expect(result).toEqual({ appliedMod: -2, conditions: ["Angry (-2 to comfort or pierce)"] });
		});

		it("removes the condition entirely when it doesn't apply to this move — still no dialog, no mod applied", async () => {
			renderTemplate.mockResolvedValue(
				renderConditionsHtml([{ label: "Guilty (-2 to provoke or assess)", mod: -2 }])
			);
			const roll = buildRoll({
				conditionGroups: ["Guilty"],
				rollType: "mundane",
				resources: NO_MODS_RESOURCES
			});

			const result = await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(
				roll,
				{ title: "Comfort or Support" },
				{}
			);

			expect(originalConfigureDialog).not.toHaveBeenCalled();
			expect(roll._onDialogSubmit).toHaveBeenCalledTimes(1);
			expect(result).toEqual({ appliedMod: 0, conditions: [] });
		});

		it("applies the summed +1-per-condition bonus for an ALL_CONDITIONS_MOVE_NAMES move", async () => {
			renderTemplate.mockResolvedValue(
				renderConditionsHtml([
					{ label: "Afraid (-2 to engage)", mod: -2 },
					{ label: "Angry (-2 to comfort or pierce)", mod: -2 }
				])
			);
			const roll = buildRoll({
				conditionGroups: ["Afraid", "Angry"],
				rollType: "formula",
				resources: NO_MODS_RESOURCES
			});

			const result = await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(
				roll,
				{ title: "Take a Powerful Blow" },
				{}
			);

			expect(originalConfigureDialog).not.toHaveBeenCalled();
			expect(result).toEqual({ appliedMod: 2, conditions: ["Afraid (+1)", "Angry (+1)"] });
		});

		it("works when data.templateData is omitted (matches _onRollStat/_onRollAttr call sites)", async () => {
			renderTemplate.mockResolvedValue(renderConditionsHtml([]));
			const roll = buildRoll({ conditionGroups: ["Angry"], rollType: "stat", resources: NO_MODS_RESOURCES });

			await expect(
				CONFIG.Dice.RollPbtA.prototype.configureDialog.call(roll, { title: "Label" }, {})
			).resolves.not.toThrow();
			expect(originalConfigureDialog).not.toHaveBeenCalled();
		});

		it("treats a missing resources object (e.g. an NPC roll) as no situational mods", async () => {
			renderTemplate.mockResolvedValue(renderConditionsHtml([]));
			const roll = buildRoll({ conditionGroups: ["Angry"], rollType: "danger", resources: undefined });

			await CONFIG.Dice.RollPbtA.prototype.configureDialog.call(roll, { title: "NPC Move" }, {});

			expect(originalConfigureDialog).not.toHaveBeenCalled();
			expect(roll._onDialogSubmit).toHaveBeenCalledTimes(1);
		});
	});
});
