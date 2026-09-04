import { describe, expect, it } from "vitest";
import moveData from "../src/packs/basic-playbook-beacon/move_No_Powers_and_Not_Nearly_Enough_Training_PTEHUoWI1ApWH8mV.json";

describe("No Powers and Not Nearly Enough Training move data", () => {
	it("still rolls +Mundane directly", () => {
		expect(moveData.system.rollType).toBe("mundane");
	});

	it("lists the three basic moves it can stand in for, so the roll picker has something to offer", () => {
		expect(moveData.flags["masks-newgeneration-unofficial"].basicMoveChoices).toEqual([
			"Compendium.masks-newgeneration-unofficial.moves.Item.RbWTLi81e6IZ9vH4",
			"Compendium.masks-newgeneration-unofficial.moves.Item.6rnOFrthWetWrS7c",
			"Compendium.masks-newgeneration-unofficial.moves.Item.sog3ZBzKUOxRDHWw"
		]);
	});
});
