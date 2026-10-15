import { vi } from "vitest";

// Foundry adds Math.clamp; Node doesn't have it.
Math.clamp ??= (value, min, max) => Math.min(Math.max(value, min), max);

export class OperatorTerm {
	constructor({ operator, options = {} }) {
		this.operator = operator;
		this.options = options;
	}
}

export class NumericTerm {
	constructor({ number, options = {} }) {
		this.number = number;
		this.options = options;
	}
}

export class DieTerm {
	constructor(total) {
		this.total = total;
		this.options = {};
	}
}

/** Stand-in for an evaluated RollPbtA: `dice` is the 2d6 result, `mods` the flat terms after it. */
export class FakeRoll {
	constructor({ dice = 7, mods = [], options = {} } = {}) {
		this.terms = [new DieTerm(dice)];
		for (const mod of mods) {
			this.terms.push(
				new OperatorTerm({ operator: mod < 0 ? "-" : "+" }),
				new NumericTerm({ number: Math.abs(mod) })
			);
		}
		this.options = { conditions: [], ...options };
		this.resetFormula = vi.fn();
		this._evaluate = vi.fn(async () => {
			let sign = 1;
			this.total = 0;
			for (const term of this.terms) {
				if (term instanceof OperatorTerm) sign = term.operator === "-" ? -1 : 1;
				else if (term instanceof NumericTerm) this.total += sign * term.number;
				else this.total += term.total;
			}
			return this;
		});
	}
}

/** Installs the foundry.dice.terms / CONFIG / game globals the roll-bonus code reads. */
export function stubRollGlobals({ minMod = -3, maxMod = 4, messages = [] } = {}) {
	vi.stubGlobal("foundry", { dice: { terms: { OperatorTerm, NumericTerm } } });
	vi.stubGlobal("CONFIG", { Dice: { RollPbtA: FakeRoll } });
	vi.stubGlobal("game", {
		pbta: { sheetConfig: { minMod, maxMod } },
		messages: { contents: messages },
		user: { id: "user1" },
		i18n: {
			localize: vi.fn((key) => key),
			format: vi.fn((key, data) => `${key}:${JSON.stringify(data)}`)
		}
	});
}

export function buildActor({ id = "actor1", forward = 0, ongoing = 0, influences = [], ...overrides } = {}) {
	return {
		id,
		name: "Kid Flash",
		type: "character",
		isOwner: true,
		system: { resources: { forward: { value: forward }, ongoing: { value: ongoing } } },
		getFlag: vi.fn((scope, key) => (key === "influences" ? influences : undefined)),
		update: vi.fn().mockResolvedValue(undefined),
		...overrides
	};
}

export function buildMessage({ id = "msg1", actorId = "actor1", roll = new FakeRoll(), flags = {}, ...overrides } = {}) {
	return {
		id,
		speaker: { actor: actorId },
		rolls: roll ? [roll] : [],
		isOwner: true,
		getFlag: vi.fn((scope, key) => flags[key]),
		update: vi.fn().mockResolvedValue(undefined),
		...overrides
	};
}
