import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrateTakeAPowerfulBlow, migrateRejectingInfluence, migrateNoPowersBasicMoveChoices } from "../module/helpers/migrations.mjs";

function buildActor(name, items) {
	return {
		name,
		items,
		updateEmbeddedDocuments: vi.fn().mockResolvedValue(undefined)
	};
}

describe("migrateTakeAPowerfulBlow", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("updates an actor's stale 'Take a Powerful Blow' move to rollType formula", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Take a Powerful Blow",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateTakeAPowerfulBlow();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "formula",
				"system.rollFormula": "2d6"
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Take a Powerful Blow",
			system: { rollType: "formula", rollFormula: "2d6" }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateTakeAPowerfulBlow();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("ignores unrelated items and items of the wrong type", async () => {
		const otherMove = {
			id: "move2",
			type: "move",
			name: "Some Other Move",
			system: { rollType: "prompt" }
		};
		const wrongType = {
			id: "item3",
			type: "equipment",
			name: "Take a Powerful Blow",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateTakeAPowerfulBlow();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Take a Powerful Blow",
			system: { rollType: "prompt" }
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateTakeAPowerfulBlow();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateRejectingInfluence", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("updates an actor's stale 'Rejecting Influence' move to rollType formula", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Rejecting Influence",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateRejectingInfluence();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "formula",
				"system.rollFormula": "2d6"
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Rejecting Influence",
			system: { rollType: "formula", rollFormula: "2d6" }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateRejectingInfluence();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("ignores unrelated items and items of the wrong type", async () => {
		const otherMove = {
			id: "move2",
			type: "move",
			name: "Some Other Move",
			system: { rollType: "prompt" }
		};
		const wrongType = {
			id: "item3",
			type: "equipment",
			name: "Rejecting Influence",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateRejectingInfluence();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Rejecting Influence",
			system: { rollType: "prompt" }
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateRejectingInfluence();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateNoPowersBasicMoveChoices", () => {
	const EXPECTED_CHOICES = [
		"Compendium.masks-newgeneration-unofficial.moves.Item.RbWTLi81e6IZ9vH4",
		"Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c",
		"Compendium.masks-newgeneration-unofficial.moves.Item.sog3ZBzKUOxRDHWw"
	];

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("adds the basicMoveChoices flag to an actor's embedded 'No Powers' move that's missing it", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "No Powers and Not Nearly Enough Training",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateNoPowersBasicMoveChoices();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"flags.masks-newgeneration-unofficial.basicMoveChoices": EXPECTED_CHOICES
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "No Powers and Not Nearly Enough Training",
			flags: { "masks-newgeneration-unofficial": { basicMoveChoices: EXPECTED_CHOICES } }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateNoPowersBasicMoveChoices();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("ignores unrelated items and items of the wrong type", async () => {
		const otherMove = {
			id: "move2",
			type: "move",
			name: "Some Other Move",
			flags: {}
		};
		const wrongType = {
			id: "item3",
			type: "equipment",
			name: "No Powers and Not Nearly Enough Training",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateNoPowersBasicMoveChoices();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "No Powers and Not Nearly Enough Training",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateNoPowersBasicMoveChoices();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});
