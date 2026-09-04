import { beforeEach, describe, expect, it, vi } from "vitest";
import { initBasicMoveConditions } from "../module/helpers/basic-move-conditions.mjs";
import { ALL_CONDITIONS_MOVE_NAMES, MOVE_CONDITIONS } from "../module/helpers/move-condition-map.mjs";

const CONDITION_LABELS = {
	Afraid: "Afraid (-2 to engage)",
	Angry: "Angry (-2 to comfort or pierce)",
	Guilty: "Guilty (-2 to provoke or assess)",
	Hopeless: "Hopeless (-2 to unleash)",
	Insecure: "Insecure (-2 to defend or reject)"
};

function formatMock(key, data) {
	return `${key}:${JSON.stringify(data ?? {})}`;
}

function buildDialogHtml({ title, conditions } = {}) {
	const root = document.createElement("form");
	if (conditions) {
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
	}
	return { root, title };
}

// Every condition offered on a real dialog, regardless of which one a given
// move actually cares about — matches what pbta always renders.
function allConditions() {
	return Object.values(CONDITION_LABELS).map((label) => ({ label, mod: -2 }));
}

describe("initBasicMoveConditions", () => {
	let handler;

	beforeEach(() => {
		vi.stubGlobal("Hooks", {
			on: vi.fn((hook, fn) => {
				if (hook === "renderDialog") handler = fn;
			})
		});
		vi.stubGlobal("game", { i18n: { format: vi.fn(formatMock) } });
		initBasicMoveConditions();
	});

	it("registers a renderDialog hook", () => {
		expect(Hooks.on).toHaveBeenCalledWith("renderDialog", expect.any(Function));
	});

	describe("every move in the condition map", () => {
		for (const [moveName, condition] of Object.entries(MOVE_CONDITIONS)) {
			it(`forces + locks ${condition} for "${moveName}", stripping the rest`, () => {
				const { root, title } = buildDialogHtml({
					title: formatMock("PBTA.RollLabel", { label: moveName }),
					conditions: allConditions()
				});
				const app = { data: { title }, setPosition: vi.fn() };

				handler(app, [root]);

				const checkboxes = root.querySelectorAll('input[name="condition"]');
				expect(checkboxes).toHaveLength(1);
				expect(checkboxes[0].dataset.content).toBe(CONDITION_LABELS[condition]);
				expect(checkboxes[0].checked).toBe(true);
				expect(checkboxes[0].disabled).toBe(true);
				expect(root.querySelector(".notes").textContent).toBe(
					formatMock("MASKS-SHEETS.Dialog.AutoConditions", { total: "-2" })
				);
				expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
			});
		}
	});

	it("removes the whole conditions cell when the applicable condition isn't marked", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Comfort or Support" }),
			conditions: [{ label: "Guilty (-2 to provoke or assess)", mod: -2 }]
		});
		const app = { data: { title }, setPosition: vi.fn() };

		handler(app, [root]);

		expect(root.querySelector(".cell--conditions")).toBeNull();
		expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
	});

	it("removes the whole conditions cell for a standalone playbook move (no condition penalizes it)", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Straight. Up. Creepin'" }),
			conditions: allConditions()
		});
		const app = { data: { title }, setPosition: vi.fn() };

		handler(app, [root]);

		expect(root.querySelector(".cell--conditions")).toBeNull();
		expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
	});

	it("removes the whole conditions cell for an adult move", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Overwhelm a Vulnerable Foe" }),
			conditions: [{ label: "Angry (-2 to comfort or pierce)", mod: -2 }]
		});
		const app = { data: { title }, setPosition: vi.fn() };

		handler(app, [root]);

		expect(root.querySelector(".cell--conditions")).toBeNull();
		expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
	});

	describe("every move in ALL_CONDITIONS_MOVE_NAMES", () => {
		for (const moveName of ALL_CONDITIONS_MOVE_NAMES) {
			it(`leaves "${moveName}"'s dialog untouched (powerful-blow.mjs owns it)`, () => {
				const { root, title } = buildDialogHtml({
					title: formatMock("PBTA.RollLabel", { label: moveName }),
					conditions: [{ label: "Angry (-2 to comfort or pierce)", mod: -2 }]
				});
				const app = { data: { title }, setPosition: vi.fn() };

				handler(app, [root]);

				const checkbox = root.querySelector('input[name="condition"]');
				expect(checkbox).not.toBeNull();
				expect(checkbox.checked).toBe(false);
				expect(checkbox.disabled).toBe(false);
				expect(app.setPosition).not.toHaveBeenCalled();
			});
		}
	});

	it("resolves the picker-driven clone's title suffix to the chosen basic move's condition", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", {
				label: "No Powers and Not Nearly Enough Training (Unleash Your Powers)"
			}),
			conditions: allConditions()
		});
		const app = { data: { title }, setPosition: vi.fn() };

		handler(app, [root]);

		const checkboxes = root.querySelectorAll('input[name="condition"]');
		expect(checkboxes).toHaveLength(1);
		expect(checkboxes[0].dataset.content).toBe(CONDITION_LABELS.Hopeless);
		expect(checkboxes[0].checked).toBe(true);
		expect(checkboxes[0].disabled).toBe(true);
	});

	it("removes the cell when the dialog title doesn't match pbta's roll-label template at all", () => {
		const { root } = buildDialogHtml({
			title: "Some Unrelated Dialog Title",
			conditions: allConditions()
		});
		const app = { data: { title: "Some Unrelated Dialog Title" }, setPosition: vi.fn() };

		handler(app, [root]);

		expect(root.querySelector(".cell--conditions")).toBeNull();
		expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
	});

	it("removes the cell when the picker-driven title's suffix isn't a known basic move", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", {
				label: "Some Move (Not A Basic Move)"
			}),
			conditions: allConditions()
		});
		const app = { data: { title }, setPosition: vi.fn() };

		handler(app, [root]);

		expect(root.querySelector(".cell--conditions")).toBeNull();
		expect(app.setPosition).toHaveBeenCalledWith({ height: "auto" });
	});

	it("no-ops when the dialog has no conditions cell", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Comfort or Support" })
		});
		const app = { data: { title } };

		expect(() => handler(app, [root])).not.toThrow();
	});
});
