import { describe, expect, it } from "vitest";
import moveData from "../src/packs/basic-playbook-outsider/move_Kirby_Craft_9ooZpYIc5R6s8K2H.json";

describe("Kirby-Craft move data", () => {
	it("rolls +Superior directly", () => {
		expect(moveData.system.rollType).toBe("superior");
	});

	it("lists the three basic moves it can stand in for, so the roll picker has something to offer", () => {
		expect(moveData.flags["masks-newgeneration-unofficial"].basicMoveChoices).toEqual([
			"Compendium.masks-newgeneration-unofficial.moves.Item.RbWTLi81e6IZ9vH4",
			"Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c",
			"Compendium.masks-newgeneration-unofficial.moves.Item.sog3ZBzKUOxRDHWw"
		]);
	});
});
