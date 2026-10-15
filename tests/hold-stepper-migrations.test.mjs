import { beforeEach, describe, expect, it, vi } from "vitest";
import { migrateHoldStepper } from "../module/helpers/migrations.mjs";

const SHARE_A_VULNERABILITY = "Team Move - Share a Vulnerability";

function buildActor(items) {
	return {
		name: "Hero",
		items,
		updateEmbeddedDocuments: vi.fn().mockResolvedValue(undefined)
	};
}

function buildMove(id, name, system, flags = {}) {
	return { id, type: "move", name, system, flags };
}

describe("migrateHoldStepper", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("flags hold moves, finding hold in the description or a result", async () => {
		const burn = buildMove("burn", "Burn", {
			description: "<p>Spend your burn on your flares.</p>",
			moveResults: { success: { value: "<p>Hold 3 burn.</p>" } }
		});
		const brainVulnerability = buildMove("vuln", SHARE_A_VULNERABILITY, {
			description: "<p>When <strong>you share a vulnerability</strong>, hold 2.</p>"
		});
		const actor = buildActor([burn, brainVulnerability]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateHoldStepper();

		expect(actor.updateEmbeddedDocuments).toHaveBeenCalledWith("Item", [
			{ _id: "burn", "flags.masks-newgeneration-unofficial.holdStepper": true },
			{ _id: "vuln", "flags.masks-newgeneration-unofficial.holdStepper": true }
		]);
	});

	it("skips a same-named Share a Vulnerability that doesn't grant hold", async () => {
		const beaconVulnerability = buildMove("vuln", SHARE_A_VULNERABILITY, {
			description: "<p>When you share a vulnerability, add 1 Team to the pool.</p>"
		});
		const actor = buildActor([beaconVulnerability]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateHoldStepper();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("skips a move that's already been migrated", async () => {
		const burn = buildMove(
			"burn",
			"Burn",
			{ moveResults: { success: { value: "<p>Hold 3 burn.</p>" } } },
			{ "masks-newgeneration-unofficial": { holdStepper: true } }
		);
		const actor = buildActor([burn]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateHoldStepper();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});

	it("ignores unrelated moves that mention hold, and items of the wrong type", async () => {
		const rejecting = buildMove("reject", "Rejecting Influence", {
			moveResults: { success: { value: "<p>You successfully hold to yourself.</p>" } }
		});
		const wrongType = { ...buildMove("item", "Burn", { description: "Hold 3 burn." }), type: "equipment" };
		const actor = buildActor([rejecting, wrongType]);
		vi.stubGlobal("game", { actors: [actor] });

		await migrateHoldStepper();

		expect(actor.updateEmbeddedDocuments).not.toHaveBeenCalled();
	});
});
