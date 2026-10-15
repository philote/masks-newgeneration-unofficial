import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrateDamagedConditionOption, migrateDamageGrantsCondition } from "../module/helpers/migrations.mjs";

const DAMAGED_LABEL = "Damaged (+1 to take a powerful blow)";

function localizeMock(key) {
	return key === "MASKS-SHEETS.CharacterSheets.conditions.options.5" ? DAMAGED_LABEL : key;
}

function buildActor({ type = "character", options, items = [] } = {}) {
	return {
		name: "Hero",
		type,
		items,
		system: { attributes: options ? { conditions: { options } } : {} },
		update: vi.fn().mockResolvedValue(undefined),
		updateEmbeddedDocuments: vi.fn().mockResolvedValue(undefined)
	};
}

const STANDARD_OPTIONS = {
	"0": { label: "Afraid (-2 to engage)", value: false },
	"4": { label: "Insecure (-2 to defend or reject)", value: false }
};

describe("migrateDamagedConditionOption", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("adds the Damaged option to a character created before it existed", async () => {
		const actor = buildActor({ options: { ...STANDARD_OPTIONS } });
		vi.stubGlobal("game", { actors: [actor], i18n: { localize: vi.fn(localizeMock) } });

		await migrateDamagedConditionOption();

		expect(actor.update).toHaveBeenCalledWith({
			"system.attributes.conditions.options.5": { label: DAMAGED_LABEL, value: false }
		});
	});

	it("skips a character that already has the option", async () => {
		const actor = buildActor({
			options: { ...STANDARD_OPTIONS, "5": { label: DAMAGED_LABEL, value: true } }
		});
		vi.stubGlobal("game", { actors: [actor], i18n: { localize: vi.fn(localizeMock) } });

		await migrateDamagedConditionOption();

		expect(actor.update).not.toHaveBeenCalled();
	});

	it("ignores NPCs and actors without a conditions attribute", async () => {
		const npc = buildActor({ type: "npc", options: { ...STANDARD_OPTIONS } });
		const bare = buildActor();
		vi.stubGlobal("game", { actors: [npc, bare], i18n: { localize: vi.fn(localizeMock) } });

		await migrateDamagedConditionOption();

		expect(npc.update).not.toHaveBeenCalled();
		expect(bare.update).not.toHaveBeenCalled();
	});
});

describe("migrateDamageGrantsCondition", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("flags an actor's stale 'Damage' move as granting Damaged", async () => {
		const staleMove = { id: "move1", type: "move", name: "Damage", flags: {} };
		const actor = buildActor({ items: [staleMove] });
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDamageGrantsCondition();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{ _id: "move1", "flags.masks-newgeneration-unofficial.grantsCondition": "Damaged" }
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Damage",
			flags: { "masks-newgeneration-unofficial": { grantsCondition: "Damaged" } }
		};
		const actor = buildActor({ items: [migratedMove] });
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDamageGrantsCondition();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("ignores unrelated items and items of the wrong type", async () => {
		const otherMove = { id: "move2", type: "move", name: "Some Other Move", flags: {} };
		const wrongType = { id: "item3", type: "equipment", name: "Damage", flags: {} };
		const actor = buildActor({ items: [otherMove, wrongType] });
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDamageGrantsCondition();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});
});
