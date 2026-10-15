import { beforeEach, describe, expect, it, vi } from "vitest";
import { initRollBonuses, renderRollBonuses, useRollBonus } from "../module/helpers/roll-bonuses.mjs";
import { FakeRoll, buildActor, buildMessage, stubRollGlobals } from "./roll-bonuses-fixtures.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";

function renderCard() {
	const html = document.createElement("div");
	html.innerHTML = `<section class="pbta-chat-card"><div class="cell"><div class="dice-roll"></div></div></section>`;
	return html;
}

function buttonsIn(html) {
	return Array.from(html.querySelectorAll(".masks-roll-bonuses button")).map((b) => b.dataset.bonus);
}

function setup({ actor = buildActor(), messages } = {}) {
	const message = buildMessage();
	stubRollGlobals({ messages: messages ?? [message] });
	vi.stubGlobal("ChatMessage", {
		getSpeakerActor: vi.fn(() => actor),
		getSpeaker: vi.fn(() => ({ actor: actor.id })),
		create: vi.fn().mockResolvedValue(undefined)
	});
	vi.stubGlobal("ui", { notifications: { warn: vi.fn() }, chat: { updateMessage: vi.fn() } });
	return { actor, message };
}

describe("renderRollBonuses", () => {
	it("adds a button per available bonus after the dice roll", () => {
		const { message } = setup({ actor: buildActor({ forward: 2, ongoing: 1 }) });
		const html = renderCard();

		renderRollBonuses(message, html);

		expect(buttonsIn(html)).toEqual(["forward", "ongoing", "influence"]);
		expect(html.querySelector(".dice-roll").nextElementSibling.classList.contains("masks-roll-bonuses")).toBe(true);
	});

	it("still offers Use Influence when the actor has no forward or ongoing", () => {
		const { message } = setup();
		const html = renderCard();

		renderRollBonuses(message, html);

		expect(buttonsIn(html)).toEqual(["influence"]);
	});

	it("adds nothing once every bonus on the roll is used up", () => {
		const { message } = setup();
		message.getFlag.mockReturnValue({ influenceUsed: true, influenceExploited: true });
		const html = renderCard();

		renderRollBonuses(message, html);

		expect(html.querySelector(".masks-roll-bonuses")).toBeNull();
	});

	it.each([
		["the viewer doesn't own the actor", { actor: { isOwner: false } }],
		["the viewer can't update the message", { message: { isOwner: false } }],
		["the speaker isn't a character", { actor: { type: "npc" } }]
	])("adds nothing when %s", (_, { actor: actorOverrides = {}, message: messageOverrides = {} }) => {
		const { message } = setup({ actor: buildActor({ forward: 1, ...actorOverrides }) });
		Object.assign(message, messageOverrides);
		const html = renderCard();

		renderRollBonuses(message, html);

		expect(html.querySelector(".masks-roll-bonuses")).toBeNull();
	});

	it("adds nothing to an older roll card once the actor has rolled again", () => {
		const older = buildMessage({ id: "old" });
		setup({ actor: buildActor({ forward: 1 }), messages: [older, buildMessage({ id: "new" })] });
		const html = renderCard();

		renderRollBonuses(older, html);

		expect(html.querySelector(".masks-roll-bonuses")).toBeNull();
	});
});

describe("useRollBonus", () => {
	it("Use Forward adds +1, spends one forward, and records it on the message", async () => {
		const { actor, message } = setup({ actor: buildActor({ forward: 2 }) });
		message.rolls[0] = new FakeRoll({ dice: 6, mods: [0] });

		await useRollBonus(message, actor, { action: "forward" });

		expect(actor.update).toHaveBeenCalledWith({ "system.resources.forward.value": 1 });
		expect(message.rolls[0].total).toBe(7);
		expect(message.rolls[0].options.conditions).toEqual(["PBTA.Forward (+1)"]);
		expect(message.update).toHaveBeenCalledWith({
			rolls: message.rolls,
			[`flags.${MODULE_ID}.rollBonuses`]: { forwardUsed: 1 }
		});
	});

	it("Use Ongoing adds +1 per click without spending it from the sheet", async () => {
		const { actor, message } = setup({ actor: buildActor({ ongoing: 3 }) });
		message.rolls[0] = new FakeRoll({ dice: 6, mods: [0] });
		message.getFlag.mockReturnValue({ ongoingUsed: 1 });

		await useRollBonus(message, actor, { action: "ongoing" });

		expect(actor.update).not.toHaveBeenCalled();
		expect(message.rolls[0].total).toBe(7);
		expect(message.rolls[0].options.conditions).toEqual(["PBTA.Ongoing (+1)"]);
		expect(message.update).toHaveBeenCalledWith(expect.objectContaining({
			[`flags.${MODULE_ID}.rollBonuses`]: { ongoingUsed: 2 }
		}));
	});

	it("refuses Use Ongoing once this roll has used all of the actor's ongoing", async () => {
		const { actor, message } = setup({ actor: buildActor({ ongoing: 2 }) });
		message.getFlag.mockReturnValue({ ongoingUsed: 2 });

		await useRollBonus(message, actor, { action: "ongoing" });

		expect(ui.notifications.warn).toHaveBeenCalledWith("MASKS-SHEETS.Chat.BonusUnavailable");
		expect(message.update).not.toHaveBeenCalled();
	});

	it("Use Influence adds +1 without posting anything else", async () => {
		const { actor, message } = setup();
		message.rolls[0] = new FakeRoll({ dice: 6, mods: [0] });

		await useRollBonus(message, actor, { action: "influence" });

		expect(message.rolls[0].total).toBe(7);
		expect(message.rolls[0].options.conditions).toEqual(["MASKS-SHEETS.Chat.InfluenceCondition (+1)"]);
		expect(message.update).toHaveBeenCalledWith(expect.objectContaining({
			[`flags.${MODULE_ID}.rollBonuses`]: { influenceUsed: true }
		}));
		expect(ChatMessage.create).not.toHaveBeenCalled();
	});

	it("Exploit Influence adds another +1 and announces the lost Influence in chat, naming no target", async () => {
		const { actor, message } = setup();
		message.getFlag.mockReturnValue({ influenceUsed: true });

		await useRollBonus(message, actor, { action: "exploit" });

		expect(message.update).toHaveBeenCalledWith(expect.objectContaining({
			[`flags.${MODULE_ID}.rollBonuses`]: { influenceUsed: true, influenceExploited: true }
		}));
		expect(ChatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
			content: `MASKS-SHEETS.Chat.ExploitedInfluence:${JSON.stringify({ actor: "Kid Flash" })}`
		}));
		expect(actor.update).not.toHaveBeenCalled();
	});

	it("refuses Exploit Influence before Use Influence", async () => {
		const { actor, message } = setup();

		await useRollBonus(message, actor, { action: "exploit" });

		expect(ui.notifications.warn).toHaveBeenCalledWith("MASKS-SHEETS.Chat.BonusUnavailable");
		expect(ChatMessage.create).not.toHaveBeenCalled();
	});

	it("refuses a bonus that's no longer available (e.g. forward spent elsewhere)", async () => {
		const { actor, message } = setup({ actor: buildActor({ forward: 0 }) });

		await useRollBonus(message, actor, { action: "forward" });

		expect(ui.notifications.warn).toHaveBeenCalledWith("MASKS-SHEETS.Chat.BonusUnavailable");
		expect(ui.chat.updateMessage).toHaveBeenCalledWith(message);
		expect(message.update).not.toHaveBeenCalled();
	});

	it("refuses to modify a roll that's no longer the actor's latest", async () => {
		const older = buildMessage({ id: "old" });
		const { actor } = setup({ actor: buildActor({ forward: 1 }), messages: [older, buildMessage({ id: "new" })] });

		await useRollBonus(older, actor, { action: "forward" });

		expect(ui.notifications.warn).toHaveBeenCalledWith("MASKS-SHEETS.Chat.NotLatestRoll");
		expect(actor.update).not.toHaveBeenCalled();
		expect(older.update).not.toHaveBeenCalled();
	});
});

describe("initRollBonuses", () => {
	it("re-renders the actor's previous roll card when a new roll lands, so its buttons go away", () => {
		const older = buildMessage({ id: "old" });
		const newer = buildMessage({ id: "new" });
		setup({ messages: [older, newer] });
		const handlers = {};
		vi.stubGlobal("Hooks", { on: vi.fn((name, fn) => { handlers[name] = fn; }) });

		initRollBonuses();
		handlers.createChatMessage(newer);

		expect(ui.chat.updateMessage).toHaveBeenCalledWith(older);
	});
});
