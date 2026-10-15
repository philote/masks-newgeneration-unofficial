import { describe, expect, it, vi } from "vitest";
import {
	adjustMoveHold,
	moveHasHoldStepper,
	moveHoldValue,
	nextHoldValue,
	setMoveHold
} from "../module/helpers/move-hold.mjs";

function buildMove(flags = {}) {
	return {
		flags: { "masks-newgeneration-unofficial": flags },
		setFlag: vi.fn().mockResolvedValue(undefined)
	};
}

describe("moveHasHoldStepper", () => {
	it("is true for a move flagged with holdStepper", () => {
		expect(moveHasHoldStepper(buildMove({ holdStepper: true }))).toBe(true);
	});

	it("is false for an unflagged move, a truthy non-boolean flag, or no move", () => {
		expect(moveHasHoldStepper(buildMove())).toBe(false);
		expect(moveHasHoldStepper(buildMove({ holdStepper: "yes" }))).toBe(false);
		expect(moveHasHoldStepper({})).toBe(false);
		expect(moveHasHoldStepper(null)).toBe(false);
	});
});

describe("moveHoldValue", () => {
	it("reads the stored hold", () => {
		expect(moveHoldValue(buildMove({ hold: 3 }))).toBe(3);
	});

	it("treats a missing, negative, or non-numeric hold as 0", () => {
		expect(moveHoldValue(buildMove())).toBe(0);
		expect(moveHoldValue(buildMove({ hold: -2 }))).toBe(0);
		expect(moveHoldValue(buildMove({ hold: "abc" }))).toBe(0);
		expect(moveHoldValue(null)).toBe(0);
	});
});

describe("nextHoldValue", () => {
	it("steps up and down by one", () => {
		expect(nextHoldValue(2, "increase")).toBe(3);
		expect(nextHoldValue(2, "decrease")).toBe(1);
	});

	it("never goes below 0", () => {
		expect(nextHoldValue(0, "decrease")).toBe(0);
	});

	it("leaves the value alone for an unknown action", () => {
		expect(nextHoldValue(2, "bogus")).toBe(2);
	});
});

describe("adjustMoveHold", () => {
	it("stores the stepped value on the move", async () => {
		const move = buildMove({ holdStepper: true, hold: 1 });

		await adjustMoveHold(move, "increase");

		expect(move.setFlag).toHaveBeenCalledWith("masks-newgeneration-unofficial", "hold", 2);
	});

	it("skips the write when decreasing from 0", async () => {
		const move = buildMove({ holdStepper: true });

		await adjustMoveHold(move, "decrease");

		expect(move.setFlag).not.toHaveBeenCalled();
	});

	it("does nothing without a move", async () => {
		await expect(adjustMoveHold(undefined, "increase")).resolves.toBeUndefined();
	});
});

describe("setMoveHold", () => {
	it.each([
		["3", 3],
		["-2", 0],
		["abc", 0],
		["2.7", 2]
	])("stores %j as %d", async (raw, expected) => {
		const move = buildMove({ holdStepper: true, hold: 5 });

		await setMoveHold(move, raw);

		expect(move.setFlag).toHaveBeenCalledWith("masks-newgeneration-unofficial", "hold", expected);
	});

	it("skips the write when the value is unchanged", async () => {
		const move = buildMove({ holdStepper: true, hold: 2 });

		await setMoveHold(move, "2");

		expect(move.setFlag).not.toHaveBeenCalled();
	});
});
