import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTeamPoolDataModel } from "../module/data/team-pool-data.mjs";

describe("createTeamPoolDataModel", () => {
	beforeEach(() => {
		vi.stubGlobal("foundry", {
			abstract: { TypeDataModel: class {} },
			data: {
				fields: {
					NumberField: vi.fn(function (opts) { return { type: "NumberField", ...opts }; }),
					ObjectField: vi.fn(function (opts) { return { type: "ObjectField", ...opts }; }),
				},
			},
		});
	});

	it("defines the pool field", () => {
		const schema = createTeamPoolDataModel().defineSchema();

		expect(schema.pool).toEqual(
			expect.objectContaining({ type: "NumberField", required: true, integer: true, min: 0, initial: 0 })
		);
	});

	// Regression test: pbta's own ActorPbta.conditionGroups getter (system code,
	// not this module's) does Object.entries(this.system.attributes) for every
	// actor unconditionally. Foundry's core ChatMessage render pipeline calls
	// getRollData() on the speaker actor for any ChatMessage.create with a
	// speaker — not just an actual roll — so a Team Pool actor with no
	// `attributes` key threw as soon as anything posted to chat with it as the
	// speaker. See postTeamPoolToChat in team-pool-utils.mjs.
	it("defines an empty-object attributes field so pbta's conditionGroups getter doesn't throw", () => {
		const schema = createTeamPoolDataModel().defineSchema();

		expect(schema.attributes).toEqual(expect.objectContaining({ type: "ObjectField", initial: {} }));
	});
});
