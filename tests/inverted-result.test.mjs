import { beforeEach, describe, expect, it, vi } from "vitest";
import { initInvertedResultColors } from "../module/helpers/inverted-result.mjs";

describe("initInvertedResultColors", () => {
	let hooks;

	beforeEach(() => {
		hooks = {};
		vi.stubGlobal("Hooks", {
			on: vi.fn((hook, fn) => { hooks[hook] = fn; }),
		});
		vi.stubGlobal("fromUuidSync", vi.fn());

		initInvertedResultColors();
	});

	function buildCard({ resultClass = "success", withResultRow = true } = {}) {
		const root = document.createElement("div");
		root.innerHTML = `
			<section class="pbta-chat-card">
				<div class="cell cell--chat">
					${withResultRow ? `<div class="row result ${resultClass}"><div class="result-label">10+</div></div>` : ""}
				</div>
			</section>
		`;
		return root;
	}

	function buildMessage(itemUuid = "Actor.a.Item.b") {
		return {
			getFlag: vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? itemUuid : undefined)),
		};
	}

	function resultRow(html) {
		return html.querySelector(".row.result");
	}

	it.each(["success", "partial", "failure"])(
		"marks Take a Powerful Blow's %s row as inverted and keeps its outcome class",
		(resultClass) => {
			fromUuidSync.mockReturnValue({ name: "Take a Powerful Blow" });
			const html = buildCard({ resultClass });

			hooks.renderChatMessageHTML(buildMessage(), html);

			expect(resultRow(html).classList.contains("masks-result-inverted")).toBe(true);
			expect(resultRow(html).classList.contains(resultClass)).toBe(true);
			expect(resultRow(html).querySelector(".result-label").textContent).toBe("10+");
		}
	);

	it.each(["Burn", "Defend"])("leaves %s's colours alone", (name) => {
		fromUuidSync.mockReturnValue({ name });
		const html = buildCard();

		hooks.renderChatMessageHTML(buildMessage(), html);

		expect(resultRow(html).classList.contains("masks-result-inverted")).toBe(false);
	});

	it("does nothing for a message that isn't a move roll", () => {
		const html = buildCard();

		hooks.renderChatMessageHTML(buildMessage(null), html);

		expect(fromUuidSync).not.toHaveBeenCalled();
		expect(resultRow(html).classList.contains("masks-result-inverted")).toBe(false);
	});

	it("does nothing for a card without a result row", () => {
		fromUuidSync.mockReturnValue({ name: "Take a Powerful Blow" });
		const html = buildCard({ withResultRow: false });

		expect(() => hooks.renderChatMessageHTML(buildMessage(), html)).not.toThrow();
		expect(html.querySelector(".masks-result-inverted")).toBeNull();
	});

	it("does nothing when the rolled item no longer exists", () => {
		fromUuidSync.mockReturnValue(null);
		const html = buildCard();

		hooks.renderChatMessageHTML(buildMessage(), html);

		expect(resultRow(html).classList.contains("masks-result-inverted")).toBe(false);
	});

	it("does nothing when the item can't be looked up synchronously", () => {
		fromUuidSync.mockImplementation(() => { throw new Error("embedded in a compendium"); });
		const html = buildCard();

		expect(() => hooks.renderChatMessageHTML(buildMessage(), html)).not.toThrow();
		expect(resultRow(html).classList.contains("masks-result-inverted")).toBe(false);
	});
});
