import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	adjustTeamPool,
	baseTeamPoolName,
	formatTeamPoolName,
	postTeamPoolToChat,
	TEAM_ACTOR_TYPE,
} from "../module/helpers/team-pool-utils.mjs";
import { initTeamPool } from "../module/helpers/team-pool.mjs";

// The real ApplicationV2/HandlebarsApplicationMixin sheet class and the real
// TypeDataModel/fields schema are exercised manually (see the plan's
// verification steps) rather than here — this keeps the hook-registration
// tests below focused on this module's own logic instead of needing a full
// ApplicationV2 + DataModel stub.
vi.mock("../module/sheets/team-pool-sheet.mjs", () => ({
	createTeamPoolActorSheet: vi.fn(() => class FakeTeamPoolActorSheet {}),
}));
vi.mock("../module/data/team-pool-data.mjs", () => ({
	createTeamPoolDataModel: vi.fn(() => class FakeTeamPoolDataModel {}),
}));

function buildActor(overrides = {}) {
	return {
		type: TEAM_ACTOR_TYPE,
		name: "Team Pool (3)",
		system: { pool: 3 },
		update: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
}

describe("team-pool-utils", () => {
	describe("baseTeamPoolName", () => {
		it("strips a trailing count suffix", () => {
			expect(baseTeamPoolName("Team Pool (5)")).toBe("Team Pool");
		});

		it("leaves a name with no suffix untouched", () => {
			expect(baseTeamPoolName("Rooftop Squad")).toBe("Rooftop Squad");
		});
	});

	describe("formatTeamPoolName", () => {
		it("appends the pool count", () => {
			expect(formatTeamPoolName("Team Pool", 4)).toBe("Team Pool (4)");
		});

		it("replaces an existing suffix instead of stacking", () => {
			expect(formatTeamPoolName("Team Pool (3)", 4)).toBe("Team Pool (4)");
		});
	});

	describe("adjustTeamPool", () => {
		it("increases the pool and persists it", async () => {
			const actor = buildActor({ system: { pool: 2 } });

			await adjustTeamPool(actor, 1);

			expect(actor.update).toHaveBeenCalledWith({ "system.pool": 3 });
		});

		it("decreases the pool", async () => {
			const actor = buildActor({ system: { pool: 2 } });

			await adjustTeamPool(actor, -1);

			expect(actor.update).toHaveBeenCalledWith({ "system.pool": 1 });
		});

		it("clamps at 0 instead of going negative", async () => {
			const actor = buildActor({ system: { pool: 0 } });

			await adjustTeamPool(actor, -1);

			expect(actor.update).toHaveBeenCalledWith({ "system.pool": 0 });
		});
	});

	describe("postTeamPoolToChat", () => {
		beforeEach(() => {
			vi.stubGlobal("game", {
				user: { id: "user1" },
				i18n: { format: vi.fn((key, data) => `${key}:${JSON.stringify(data)}`) },
			});
			vi.stubGlobal("ChatMessage", {
				create: vi.fn().mockResolvedValue(undefined),
				getSpeaker: vi.fn(({ actor }) => ({ actor: actor.name })),
			});
		});

		it("posts the current pool value as a chat message spoken by the actor", async () => {
			const actor = buildActor({ system: { pool: 5 } });

			await postTeamPoolToChat(actor);

			expect(game.i18n.format).toHaveBeenCalledWith("MASKS-SHEETS.Chat.TeamPool", { value: 5 });
			expect(ChatMessage.getSpeaker).toHaveBeenCalledWith({ actor });
			expect(ChatMessage.create).toHaveBeenCalledWith({
				user: "user1",
				content: 'MASKS-SHEETS.Chat.TeamPool:{"value":5}',
				speaker: { actor: "Team Pool (3)" },
			});
		});
	});
});

describe("initTeamPool", () => {
	let hooks;

	beforeEach(() => {
		hooks = {};
		vi.stubGlobal("Hooks", {
			on: vi.fn((hook, fn) => { hooks[hook] = fn; }),
			once: vi.fn((hook, fn) => { hooks[hook] = fn; }),
		});
		vi.stubGlobal("CONFIG", { Actor: { dataModels: {} } });
		vi.stubGlobal("CONST", {
			DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 },
			TOKEN_DISPLAY_MODES: { ALWAYS: 50 },
			TOKEN_DISPOSITIONS: { NEUTRAL: 0 },
		});
		vi.stubGlobal("game", { i18n: { localize: vi.fn((key) => key) }, pbta: { sheetConfig: { actorTypes: { character: {} } } } });
		vi.stubGlobal("foundry", {
			documents: { collections: { Actors: { registerSheet: vi.fn() } } },
			utils: { getProperty: (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj) },
		});

		initTeamPool();
	});

	it("registers the data model for the team actor type", () => {
		expect(CONFIG.Actor.dataModels[TEAM_ACTOR_TYPE]).toBeDefined();
	});

	it("registers the sheet as the default for the team type", () => {
		expect(foundry.documents.collections.Actors.registerSheet).toHaveBeenCalledWith(
			"masks-newgeneration-unofficial",
			expect.any(Function),
			expect.objectContaining({ types: [TEAM_ACTOR_TYPE], makeDefault: true })
		);
	});

	describe("pbtaSheetConfig", () => {
		// pbta's own Actor.createDialog() override only offers types that are keys of
		// game.pbta.sheetConfig.actorTypes (see team-pool.mjs's comment for the exact
		// pbta source reference) — without this, "Team Pool" can never appear in the
		// Create Actor dialog even though Foundry's own document-type registry has it.
		it("adds a Team Pool entry to game.pbta.sheetConfig.actorTypes so pbta's Create Actor dialog offers it", () => {
			hooks.pbtaSheetConfig();

			expect(game.pbta.sheetConfig.actorTypes[TEAM_ACTOR_TYPE]).toEqual({
				label: "TYPES.Actor.masks-newgeneration-unofficial.team",
				stats: {},
				attributes: {},
			});
		});

		it("leaves the pre-existing actor types (set by masks.mjs's own configSheet()) untouched", () => {
			hooks.pbtaSheetConfig();

			expect(game.pbta.sheetConfig.actorTypes.character).toEqual({});
		});
	});

	describe("preCreateActor", () => {
		it("sets default ownership, a linked always-visible token, and the initial name suffix", () => {
			const document = {
				type: TEAM_ACTOR_TYPE,
				name: "Team Pool",
				system: { pool: 0 },
				updateSource: vi.fn(),
			};

			hooks.preCreateActor(document);

			expect(document.updateSource).toHaveBeenCalledWith({
				name: "Team Pool (0)",
				"ownership.default": 3,
				prototypeToken: {
					actorLink: true,
					displayName: 50,
					disposition: 0,
				},
			});
		});

		it("ignores actors of any other type", () => {
			const document = { type: "character", updateSource: vi.fn() };

			hooks.preCreateActor(document);

			expect(document.updateSource).not.toHaveBeenCalled();
		});
	});

	describe("updateActor", () => {
		it("renames the actor so the always-visible nameplate reflects the new pool value", () => {
			const actor = buildActor({ name: "Team Pool (3)", system: { pool: 4 } });

			hooks.updateActor(actor, { system: { pool: 4 } });

			expect(actor.update).toHaveBeenCalledWith({ name: "Team Pool (4)" });
		});

		it("preserves a manually-renamed base label", () => {
			const actor = buildActor({ name: "Rooftop Squad (3)", system: { pool: 5 } });

			hooks.updateActor(actor, { system: { pool: 5 } });

			expect(actor.update).toHaveBeenCalledWith({ name: "Rooftop Squad (5)" });
		});

		it("does nothing when the change doesn't touch the pool", () => {
			const actor = buildActor({ name: "Team Pool (3)" });

			hooks.updateActor(actor, { img: "new.webp" });

			expect(actor.update).not.toHaveBeenCalled();
		});

		it("doesn't re-trigger itself once the name already matches the new pool (avoids an infinite loop)", () => {
			const actor = buildActor({ name: "Team Pool (4)", system: { pool: 4 } });

			hooks.updateActor(actor, { name: "Team Pool (4)" });

			expect(actor.update).not.toHaveBeenCalled();
		});

		it("ignores actors of any other type", () => {
			const actor = buildActor({ type: "character" });

			hooks.updateActor(actor, { system: { pool: 4 } });

			expect(actor.update).not.toHaveBeenCalled();
		});
	});

	describe("renderTokenHUD", () => {
		function buildHud(actor) {
			return { object: { actor } };
		}

		function buildHudRoot() {
			const root = document.createElement("div");
			root.innerHTML = '<div class="col right"></div>';
			return root;
		}

		it("injects +/- buttons showing the current pool value", () => {
			const actor = buildActor({ system: { pool: 2 } });
			const root = buildHudRoot();

			hooks.renderTokenHUD(buildHud(actor), root);

			const widget = root.querySelector(".team-pool-hud");
			expect(widget).not.toBeNull();
			expect(widget.querySelector(".team-pool-hud__value").textContent).toBe("2");
		});

		it("wires the + button to adjustTeamPool", () => {
			const actor = buildActor({ system: { pool: 2 } });
			const root = buildHudRoot();

			hooks.renderTokenHUD(buildHud(actor), root);
			root.querySelector(".team-pool-hud__increase").click();

			expect(actor.update).toHaveBeenCalledWith({ "system.pool": 3 });
		});

		it("wires the - button to adjustTeamPool, clamped at 0", () => {
			const actor = buildActor({ system: { pool: 0 } });
			const root = buildHudRoot();

			hooks.renderTokenHUD(buildHud(actor), root);
			root.querySelector(".team-pool-hud__decrease").click();

			expect(actor.update).toHaveBeenCalledWith({ "system.pool": 0 });
		});

		it("does nothing for a token with no actor or a non-team actor", () => {
			const root = buildHudRoot();

			hooks.renderTokenHUD(buildHud(null), root);
			hooks.renderTokenHUD(buildHud(buildActor({ type: "character" })), root);

			expect(root.querySelector(".team-pool-hud")).toBeNull();
		});

		it("supports jQuery-style html arrays as well as raw elements", () => {
			const actor = buildActor({ system: { pool: 1 } });
			const root = buildHudRoot();

			hooks.renderTokenHUD(buildHud(actor), [root]);

			expect(root.querySelector(".team-pool-hud")).not.toBeNull();
		});
	});
});
