import { beforeEach, describe, expect, it, vi } from "vitest";
import { initPowerfulBlow } from "../module/helpers/powerful-blow.mjs";

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

describe("initPowerfulBlow", () => {
	let handler;

	beforeEach(() => {
		vi.stubGlobal("Hooks", {
			on: vi.fn((hook, fn) => {
				if (hook === "renderDialog") handler = fn;
			})
		});
		vi.stubGlobal("game", { i18n: { format: vi.fn(formatMock) } });
		initPowerfulBlow();
	});

	it("registers a renderDialog hook", () => {
		expect(Hooks.on).toHaveBeenCalledWith("renderDialog", expect.any(Function));
	});

	it("force-checks and disables condition checkboxes, overriding the usual -2 penalty with the move's +1-per-condition bonus", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Take a Powerful Blow" }),
			conditions: [
				{ label: "Afraid (-2 to engage)", mod: -2 },
				{ label: "Angry (-2 to comfort or pierce)", mod: -2 }
			]
		});
		const app = { data: { title } };

		handler(app, [root]);

		const checkboxes = root.querySelectorAll('input[name="condition"]');
		expect(checkboxes[0].dataset.mod).toBe("1");
		expect(checkboxes[0].dataset.content).toBe("Afraid (+1)");
		expect(checkboxes[1].dataset.mod).toBe("1");
		expect(checkboxes[1].dataset.content).toBe("Angry (+1)");
		checkboxes.forEach((checkbox) => {
			expect(checkbox.checked).toBe(true);
			expect(checkbox.disabled).toBe(true);
		});
		expect(root.querySelector(".notes").textContent).toBe(
			formatMock("MASKS-SHEETS.Dialog.AutoConditions", { total: "+2" })
		);
	});

	it("applies the same +1-per-condition bonus to Burn (The Nova)", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Burn" }),
			conditions: [{ label: "Hopeless (-2 to unleash)", mod: -2 }]
		});
		const app = { data: { title } };

		handler(app, [root]);

		const checkbox = root.querySelector('input[name="condition"]');
		expect(checkbox.dataset.mod).toBe("1");
		expect(checkbox.dataset.content).toBe("Hopeless (+1)");
		expect(checkbox.checked).toBe(true);
		expect(checkbox.disabled).toBe(true);
		expect(root.querySelector(".notes").textContent).toBe(
			formatMock("MASKS-SHEETS.Dialog.AutoConditions", { total: "+1" })
		);
	});

	it("no-ops when the actor has no marked conditions", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Take a Powerful Blow" })
		});
		const app = { data: { title } };

		expect(() => handler(app, [root])).not.toThrow();
	});

	it("leaves other moves' dialogs untouched", () => {
		const { root, title } = buildDialogHtml({
			title: formatMock("PBTA.RollLabel", { label: "Some Other Move" }),
			conditions: [{ label: "Afraid (-2 to engage)", mod: -2 }]
		});
		const app = { data: { title } };

		handler(app, [root]);

		const checkbox = root.querySelector('input[name="condition"]');
		expect(checkbox.checked).toBe(false);
		expect(checkbox.disabled).toBe(false);
	});
});
