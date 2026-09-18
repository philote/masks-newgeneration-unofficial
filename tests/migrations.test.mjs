import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	migrateTakeAPowerfulBlow,
	migrateRejectingInfluence,
	migrateBurn,
	migrateNoPowersBasicMoveChoices,
	migrateKirbyCraftBasicMoveChoices,
	migrateWheneverTimePasses,
	migrateAHigherCalling,
	migrateFriendsInLowPlaces,
	migrateLegacy,
	migrateConnectingTheDots,
	migrateAllTheBestStuff,
	migrateAHigherCallingLabelSwap,
	migrateDuplicateChoiceLists
} from "../module/helpers/migrations.mjs";

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

describe("migrateBurn", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("updates an actor's stale 'Burn' move to rollType formula", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Burn",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateBurn();

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
			name: "Burn",
			system: { rollType: "formula", rollFormula: "2d6" }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateBurn();

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
			name: "Burn",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateBurn();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Burn",
			system: { rollType: "prompt" }
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateBurn();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateWheneverTimePasses", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("updates an actor's stale 'Whenever time passes' move to rollType savior", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Whenever time passes",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateWheneverTimePasses();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "savior",
				"system.rollFormula": ""
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Whenever time passes",
			system: { rollType: "savior", rollFormula: "" }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateWheneverTimePasses();

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
			name: "Whenever time passes",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateWheneverTimePasses();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Whenever time passes",
			system: { rollType: "prompt" }
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateWheneverTimePasses();

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

describe("migrateAHigherCalling", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("migrates an actor's stale 'A Higher Calling' move to a formula roll flagged with theSoldier", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "A Higher Calling",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAHigherCalling();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "formula",
				"system.rollFormula": "2d6",
				"flags.masks-newgeneration-unofficial.attributeRollKey": "theSoldier"
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "A Higher Calling",
			flags: { "masks-newgeneration-unofficial": { attributeRollKey: "theSoldier" } }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAHigherCalling();

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
			name: "A Higher Calling",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAHigherCalling();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "A Higher Calling",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateAHigherCalling();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateKirbyCraftBasicMoveChoices", () => {
	const EXPECTED_CHOICES = [
		"Compendium.masks-newgeneration-unofficial.moves.Item.RbWTLi81e6IZ9vH4",
		"Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c",
		"Compendium.masks-newgeneration-unofficial.moves.Item.sog3ZBzKUOxRDHWw"
	];

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("adds the basicMoveChoices flag and rollType to an actor's embedded 'Kirby-Craft' move that's missing it", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Kirby-Craft",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateKirbyCraftBasicMoveChoices();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "superior",
				"flags.masks-newgeneration-unofficial.basicMoveChoices": EXPECTED_CHOICES
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Kirby-Craft",
			flags: { "masks-newgeneration-unofficial": { basicMoveChoices: EXPECTED_CHOICES } }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateKirbyCraftBasicMoveChoices();

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
			name: "Kirby-Craft",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateKirbyCraftBasicMoveChoices();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Kirby-Craft",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateKirbyCraftBasicMoveChoices();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateFriendsInLowPlaces", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("migrates an actor's stale 'Friends in Low Places' move to a formula roll flagged with theReformed", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Friends in Low Places",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateFriendsInLowPlaces();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "formula",
				"system.rollFormula": "2d6",
				"flags.masks-newgeneration-unofficial.attributeRollKey": "theReformed",
				"flags.masks-newgeneration-unofficial.attributeRollResolver": "highestCheckedCount"
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Friends in Low Places",
			flags: {
				"masks-newgeneration-unofficial": {
					attributeRollKey: "theReformed",
					attributeRollResolver: "highestCheckedCount"
				}
			}
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateFriendsInLowPlaces();

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
			name: "Friends in Low Places",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateFriendsInLowPlaces();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Friends in Low Places",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateFriendsInLowPlaces();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateLegacy", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("updates an actor's stale 'Legacy' move to rollType savior", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Legacy",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateLegacy();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "savior",
				"system.rollFormula": ""
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Legacy",
			system: { rollType: "savior", rollFormula: "" }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateLegacy();

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
			name: "Legacy",
			system: { rollType: "prompt" }
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateLegacy();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Legacy",
			system: { rollType: "prompt" }
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateLegacy();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateConnectingTheDots", () => {
	const EXPECTED_ROLL_OPTIONS = [
		{
			label: "Remember someone's future self",
			attributeRollKey: "theHarbingerMemories",
			moveResults: {
				success: {
					key: "data.moveResults.success.value",
					label: "Success!",
					value: "<p>You connect who they are now to who they are in the future; choose the role that they fulfill in the future, and the GM will tell you about their future self. You can also ask a follow-up question.</p>"
				},
				partial: {
					key: "data.moveResults.partial.value",
					label: "Partial success",
					value: "<p>You connect who they are now to who they are in the future; choose the role that they fulfill in the future, and the GM will tell you about their future self.</p>"
				},
				failure: {
					key: "data.moveResults.failure.value",
					label: "Complications...",
					value: "<p>They're not at all who you thought they would be; the GM will choose their role, or tell you that as far as you know, they don't exist in the future.</p>"
				}
			}
		},
		{
			label: "Investigate the timeline",
			rollType: "savior",
			moveResults: {
				success: {
					key: "data.moveResults.success.value",
					label: "Success!",
					value: "<p>Choose one figure noted above or one aspect of the future world you can remember. You've found a lead to follow to learn more about how the present version of that figure or aspect became the future version. The lead is particularly strong; right now, you can ask the GM one question about the figure or aspect, and they will answer honestly.</p>"
				},
				partial: {
					key: "data.moveResults.partial.value",
					label: "Partial success",
					value: "<p>Choose one figure noted above or one aspect of the future world you can remember. You've found a lead to follow to learn more about how the present version of that figure or aspect became the future version.</p>"
				},
				failure: {
					key: "data.moveResults.failure.value",
					label: "Complications...",
					value: "<p>You're lost in the present; the GM will tell you how things are so different here, and shift your Labels according to how it makes you feel.</p>"
				}
			}
		}
	];

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("adds the rollOptions flag and rollType to an actor's embedded 'Connecting the Dots' move that's missing it", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Connecting the Dots",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateConnectingTheDots();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "ask",
				"flags.masks-newgeneration-unofficial.rollOptions": EXPECTED_ROLL_OPTIONS
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "Connecting the Dots",
			flags: { "masks-newgeneration-unofficial": { rollOptions: EXPECTED_ROLL_OPTIONS } }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateConnectingTheDots();

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
			name: "Connecting the Dots",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateConnectingTheDots();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "Connecting the Dots",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateConnectingTheDots();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateAllTheBestStuff", () => {
	const EXPECTED_ROLL_OPTIONS = [
		{ label: "A hero's cache", rollType: "savior" },
		{ label: "A villain's cache", rollType: "danger" }
	];

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("adds the rollOptions flag and rollType to an actor's embedded 'All the Best Stuff' move that's missing it", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "All the Best Stuff",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAllTheBestStuff();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.rollType": "ask",
				"flags.masks-newgeneration-unofficial.rollOptions": EXPECTED_ROLL_OPTIONS
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "All the Best Stuff",
			flags: { "masks-newgeneration-unofficial": { rollOptions: EXPECTED_ROLL_OPTIONS } }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAllTheBestStuff();

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
			name: "All the Best Stuff",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAllTheBestStuff();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "All the Best Stuff",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateAllTheBestStuff();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateAHigherCallingLabelSwap", () => {
	const EXPECTED_LABEL_SWAP = {
		attributeKey: "theSoldier",
		moveTypes: ["basic", "playbook"],
		reminderText: "Give A.E.G.I.S. Influence over you."
	};

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("adds the labelSwap flag to an actor's embedded 'A Higher Calling' move that's missing it", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "A Higher Calling",
			flags: {}
		};
		const actor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAHigherCallingLabelSwap();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"flags.masks-newgeneration-unofficial.labelSwap": EXPECTED_LABEL_SWAP
			}
		]);
	});

	it("skips a move that's already been migrated", async () => {
		const migratedMove = {
			id: "move1",
			type: "move",
			name: "A Higher Calling",
			flags: { "masks-newgeneration-unofficial": { labelSwap: EXPECTED_LABEL_SWAP } }
		};
		const actor = buildActor("Hero", [migratedMove]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAHigherCallingLabelSwap();

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
			name: "A Higher Calling",
			flags: {}
		};
		const actor = buildActor("Hero", [otherMove, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateAHigherCallingLabelSwap();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("handles multiple actors independently", async () => {
		const staleMove = {
			id: "move1",
			type: "move",
			name: "A Higher Calling",
			flags: {}
		};
		const cleanActor = buildActor("Sidekick", []);
		const staleActor = buildActor("Hero", [staleMove]);
		vi.stubGlobal("game", { actors: [cleanActor, staleActor] });

		await migrateAHigherCallingLabelSwap();

		expect(cleanActor.updateEmbeddedDocuments).not.toHaveBeenCalled();
		expect(staleActor.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);
	});
});

describe("migrateDuplicateChoiceLists", () => {
	const STALE_LIST =
		"\n<ul>\n<li>do what you say</li>\n<li>get out of your way</li>\n<li>attack you at a disadvantage</li>\n<li>freeze</li>\n</ul>";

	function buildMove(overrides = {}) {
		return {
			id: "move1",
			type: "move",
			name: "Symbol of Authority",
			system: {
				choices: "<ul>\n<li>\n<h4>@UUID[Compendium.x.y.z]{Do what you say}</h4>\n</li>\n</ul>",
				moveResults: {
					success: { value: "<p>They choose one. You also take +1 forward against them.</p>" + STALE_LIST },
					partial: { value: "<p>They choose one.</p>" + STALE_LIST }
				},
				...overrides
			}
		};
	}

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("strips the duplicated prose list from both results", async () => {
		const actor = buildActor("Hero", [buildMove()]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "move1",
				"system.moveResults.success.value":
					"<p>They choose one. You also take +1 forward against them.</p>",
				"system.moveResults.partial.value": "<p>They choose one.</p>"
			}
		]);
	});

	it("is idempotent once the list has been removed", async () => {
		const migrated = buildMove({
			moveResults: {
				success: { value: "<p>They choose one. You also take +1 forward against them.</p>" },
				partial: { value: "<p>They choose one.</p>" }
			}
		});
		const actor = buildActor("Hero", [migrated]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("leaves a move alone when the player has rewritten the list", async () => {
		const customized = buildMove({
			moveResults: {
				success: { value: "<p>They choose one.</p>\n<ul>\n<li>my own option</li>\n</ul>" },
				partial: { value: "<p>They choose one.</p>\n<ul>\n<li>my own option</li>\n</ul>" }
			}
		});
		const actor = buildActor("Hero", [customized]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("leaves the prose list in place when there are no choices to replace it", async () => {
		const actor = buildActor("Hero", [buildMove({ choices: "" })]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("ignores a move of another name carrying the same markup", async () => {
		const other = buildMove();
		other.name = "Some Other Move";
		const actor = buildActor("Hero", [other]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});
});

describe("migrateDuplicateChoiceLists - Fight the Good Fight", () => {
	const STALE_LIST = "\n<ul>\n<li class=\"p1\">resist or avoid their blows</li>\n<li class=\"p1\">take something from them</li>\n<li class=\"p1\">create an opportunity for your allies</li>\n<li class=\"p1\"><s>impress, surprise, or frighten the opposition</s></li>\n</ul>";
	const OLD_CHOICES = "<ul>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.t9kFvEp4eNYMCUkC]{Resisting or avoiding their blows}</h4>\n</li>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.VTyTLEzt5Zbx3JM4]{Taking something from them}</h4>\n</li>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.AGsdZxeDIixx5ulh]{Creating an opportunity for your allies}</h4>\n</li>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.3e3Dyp1IAnqrGwNj]{Impress, surprise, or frighten the opposition}</h4>\n</li>\n</ul>";
	const NEW_CHOICES = "<ul>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.t9kFvEp4eNYMCUkC]{Resisting or avoiding their blows}</h4>\n</li>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.VTyTLEzt5Zbx3JM4]{Taking something from them}</h4>\n</li>\n<li>\n<h4>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.AGsdZxeDIixx5ulh]{Creating an opportunity for your allies}</h4>\n</li>\n<li>\n<h4><s>@UUID[Compendium.masks-newgeneration-unofficial.documents.JournalEntry.w5RMQhyRMu0Kz8Bh.JournalEntryPage.3e3Dyp1IAnqrGwNj]{Impress, surprise, or frighten the opposition}</s></h4>\n</li>\n</ul>";

	function buildMove(overrides = {}) {
		return {
			id: "ftgf1",
			type: "move",
			name: "Fight the Good Fight",
			system: {
				choices: OLD_CHOICES,
				moveResults: {
					success: { value: "<p>Trade blows and pick two.</p>" + STALE_LIST },
					partial: { value: "<p>Trade blows and pick one.</p>" + STALE_LIST }
				},
				...overrides
			}
		};
	}

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("drops the prose list and strikes the forbidden option in the choices", async () => {
		const actor = buildActor("Hero", [buildMove()]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{
				_id: "ftgf1",
				"system.moveResults.success.value": "<p>Trade blows and pick two.</p>",
				"system.moveResults.partial.value": "<p>Trade blows and pick one.</p>",
				"system.choices": NEW_CHOICES
			}
		]);
	});

	it("keeps the restriction visible rather than dropping the option", async () => {
		const actor = buildActor("Hero", [buildMove()]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		const [[, [update]]] = actor.updateEmbeddedDocuments.mock.calls;
		expect(update["system.choices"]).toContain("Impress, surprise, or frighten the opposition");
		expect(update["system.choices"]).toContain("<s>");
	});

	it("is idempotent once the option is already struck", async () => {
		const migrated = buildMove({
			choices: NEW_CHOICES,
			moveResults: {
				success: { value: "<p>Trade blows and pick two.</p>" },
				partial: { value: "<p>Trade blows and pick one.</p>" }
			}
		});
		const actor = buildActor("Hero", [migrated]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateDuplicateChoiceLists();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});
});
