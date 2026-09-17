import { describe, expect, it } from "vitest";
import moveData from "../src/packs/basic-playbook-legacy/move_Legacy_CBIDuMeXDJs5Ec8K.json";

describe("Legacy move data", () => {
	it("rolls +Savior directly", () => {
		expect(moveData.system.rollType).toBe("savior");
	});
});
