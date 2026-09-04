import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrateTakeAPowerfulBlow } from "../module/helpers/migrations.mjs";

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
