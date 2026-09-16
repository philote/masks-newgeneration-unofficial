import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getPotentialAttribute,
	isPotentialFull,
	markPotential,
	shouldOfferMarkPotential,
} from "../module/helpers/mark-potential-utils.mjs";
import { initMarkPotentialButton } from "../module/helpers/mark-potential.mjs";

function buildActor(overrides = {}) {
	return {
		isOwner: true,
		system: { attributes: { xp: { value: 1, max: 5, steps: [true, false, false, false, false], position: "Top" } } },
		update: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
}

describe("mark-potential-utils", () => {
	describe("shouldOfferMarkPotential", () => {
		it("offers the button for a catalog move on a failed roll", () => {
			expect(shouldOfferMarkPotential("Defend", true)).toBe(true);
		});

		it("doesn't offer it for a non-catalog move", () => {
			expect(shouldOfferMarkPotential("Burn", true)).toBe(false);
		});

		it("doesn't offer it when the roll wasn't a failure", () => {
			expect(shouldOfferMarkPotential("Defend", false)).toBe(false);
		});
	});

	describe("getPotentialAttribute", () => {
		it("returns the actor's xp attribute", () => {
			const actor = buildActor();
			expect(getPotentialAttribute(actor)).toBe(actor.system.attributes.xp);
		});

		it("returns undefined for an actor with no attributes (e.g. an NPC)", () => {
			expect(getPotentialAttribute({ system: {} })).toBeUndefined();
		});
	});

	describe("isPotentialFull", () => {
		it("is false below max", () => {
			expect(isPotentialFull({ value: 4, max: 5 })).toBe(false);
		});

		it("is true at max", () => {
			expect(isPotentialFull({ value: 5, max: 5 })).toBe(true);
		});
	});

	describe("markPotential", () => {
		it("increments the value and persists the whole attribute object", async () => {
			const actor = buildActor({ system: { attributes: { xp: { value: 2, max: 5, steps: [], position: "Top" } } } });

			await markPotential(actor);

			expect(actor.update).toHaveBeenCalledWith({
				"system.attributes.xp": { value: 3, max: 5, steps: [], position: "Top" },
			});
		});

		it("no-ops once already at max", async () => {
			const actor = buildActor({ system: { attributes: { xp: { value: 5, max: 5 } } } });

			await markPotential(actor);

			expect(actor.update).not.toHaveBeenCalled();
		});

		it("no-ops for an actor with no potential attribute", async () => {
			const actor = buildActor({ system: {} });

			await markPotential(actor);

			expect(actor.update).not.toHaveBeenCalled();
		});
	});
});

describe("initMarkPotentialButton", () => {
	let hooks;

	beforeEach(() => {
		hooks = {};
		vi.stubGlobal("Hooks", {
			on: vi.fn((hook, fn) => { hooks[hook] = fn; }),
			once: vi.fn((hook, fn) => { hooks[hook] = fn; }),
		});
		vi.stubGlobal("game", { i18n: { localize: vi.fn(() => "Mark Potential") } });
		vi.stubGlobal("fromUuid", vi.fn());
		vi.stubGlobal("ChatMessage", { getSpeakerActor: vi.fn() });

		initMarkPotentialButton();
	});

	function buildCard({ resultClass = "failure" } = {}) {
		const root = document.createElement("div");
		root.innerHTML = `
			<section class="pbta-chat-card">
				<div class="cell cell--chat">
					<div class="row result ${resultClass}"></div>
				</div>
			</section>
		`;
		return root;
	}

	function buildMessage(overrides = {}) {
		const flags = {};
		return {
			getFlag: vi.fn((scope, key) => flags[`${scope}.${key}`]),
			setFlag: vi.fn(async (scope, key, value) => { flags[`${scope}.${key}`] = value; }),
			speaker: {},
			...overrides,
		};
	}

	it("does nothing for a message that isn't a move roll", async () => {
		const message = buildMessage({ getFlag: vi.fn(() => undefined) });
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);

		expect(html.querySelector(".masks-mark-potential")).toBeNull();
	});

	it("does nothing when the roll wasn't a failure", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? "Item.abc" : undefined));
		const html = buildCard({ resultClass: "success" });

		await hooks.renderChatMessageHTML(message, html);

		expect(html.querySelector(".masks-mark-potential")).toBeNull();
	});

	it("does nothing for a move not in the potential catalog", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? "Item.abc" : undefined));
		fromUuid.mockResolvedValue({ name: "Burn" });
		ChatMessage.getSpeakerActor.mockReturnValue(buildActor());
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);

		expect(html.querySelector(".masks-mark-potential")).toBeNull();
	});

	it("does nothing for a viewer who isn't the GM or the actor's owner", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? "Item.abc" : undefined));
		fromUuid.mockResolvedValue({ name: "Defend" });
		ChatMessage.getSpeakerActor.mockReturnValue(buildActor({ isOwner: false }));
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);

		expect(html.querySelector(".masks-mark-potential")).toBeNull();
	});

	it("does nothing once the message is already flagged as marked", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => {
			if (scope === "pbta" && key === "itemUuid") return "Item.abc";
			if (scope === "masks-newgeneration-unofficial" && key === "potentialMarked") return true;
			return undefined;
		});
		fromUuid.mockResolvedValue({ name: "Defend" });
		ChatMessage.getSpeakerActor.mockReturnValue(buildActor());
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);

		expect(html.querySelector(".masks-mark-potential")).toBeNull();
	});

	it("adds an enabled button for the GM/owner on a catalog move's failure", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? "Item.abc" : undefined));
		fromUuid.mockResolvedValue({ name: "Defend" });
		ChatMessage.getSpeakerActor.mockReturnValue(buildActor());
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);

		const button = html.querySelector(".masks-mark-potential");
		expect(button).not.toBeNull();
		expect(button.disabled).toBe(false);
	});

	it("adds a disabled button once Potential is already full", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? "Item.abc" : undefined));
		fromUuid.mockResolvedValue({ name: "Defend" });
		ChatMessage.getSpeakerActor.mockReturnValue(buildActor({ system: { attributes: { xp: { value: 5, max: 5 } } } }));
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);

		const button = html.querySelector(".masks-mark-potential");
		expect(button).not.toBeNull();
		expect(button.disabled).toBe(true);
	});

	it("marks potential and flags the message when clicked", async () => {
		const message = buildMessage();
		message.getFlag = vi.fn((scope, key) => (scope === "pbta" && key === "itemUuid" ? "Item.abc" : undefined));
		fromUuid.mockResolvedValue({ name: "Defend" });
		const actor = buildActor({ system: { attributes: { xp: { value: 1, max: 5, steps: [], position: "Top" } } } });
		ChatMessage.getSpeakerActor.mockReturnValue(actor);
		const html = buildCard();

		await hooks.renderChatMessageHTML(message, html);
		const button = html.querySelector(".masks-mark-potential");
		button.click();
		await Promise.resolve();
		await Promise.resolve();

		expect(actor.update).toHaveBeenCalledWith({
			"system.attributes.xp": { value: 2, max: 5, steps: [], position: "Top" },
		});
		expect(message.setFlag).toHaveBeenCalledWith("masks-newgeneration-unofficial", "potentialMarked", true);
	});
});
