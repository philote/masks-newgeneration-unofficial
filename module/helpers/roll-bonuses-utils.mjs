export const MODULE_ID = "masks-newgeneration-unofficial";

function isTagged(term) {
    return Boolean(term.options?.rollShifting || term.options?.masksBonus);
}

/**
 * The signed sum of a roll's flat modifiers, ignoring pbta's GM roll-shift terms
 * and this module's own bonus terms.
 */
export function baseModifier(roll) {
    const { NumericTerm, OperatorTerm } = foundry.dice.terms;
    let sign = 1;
    let total = 0;
    for (const term of roll.terms) {
        if (term instanceof OperatorTerm) {
            sign = term.operator === "-" ? -1 : 1;
        } else if (term instanceof NumericTerm && !isTagged(term)) {
            total += sign * term.number;
        }
    }
    return total;
}

function clampMod(value) {
    const { minMod, maxMod } = game.pbta.sheetConfig ?? {};
    return Math.clamp(value, minMod ?? -Infinity, maxMod ?? Infinity);
}

/**
 * Adds a post-roll bonus to an already-evaluated RollPbtA, the same way pbta's own
 * GM shiftUp/shiftDown chat buttons mutate a posted roll. All bonuses share one
 * tagged term so the sheetConfig min/max modifier cap applies to their total.
 */
export async function applyRollBonus(roll, amount, conditionLabel) {
    const { NumericTerm, OperatorTerm } = foundry.dice.terms;
    const options = roll.options;

    options.masksBaseMod ??= options.originalMod ?? baseModifier(roll);
    options.masksBonusTotal = (options.masksBonusTotal ?? 0) + amount;

    const base = options.masksBaseMod;
    const uncapped = base + options.masksBonusTotal;
    const delta = clampMod(uncapped) - clampMod(base);

    let bonusTerm = roll.terms.find((term) => term instanceof NumericTerm && term.options?.masksBonus);
    if (!bonusTerm) {
        bonusTerm = new NumericTerm({ number: 0, options: { masksBonus: true } });
        roll.terms.push(new OperatorTerm({ operator: "+", options: { masksBonus: true } }), bonusTerm);
    }
    bonusTerm.number = delta;

    if (clampMod(uncapped) !== uncapped) options.originalMod = uncapped;
    else delete options.originalMod;

    options.conditions ??= [];
    options.conditions.push(conditionLabel);

    roll.resetFormula();
    await roll._evaluate();
    return roll;
}

/**
 * Which bonus buttons a roll card should offer right now, from the live actor and
 * the bonuses already spent on this roll (the message's rollBonuses flag).
 */
export function availableBonuses(actor, state = {}) {
    const bonuses = [];
    const forward = Number(actor.system?.resources?.forward?.value) || 0;
    const ongoing = Number(actor.system?.resources?.ongoing?.value) || 0;

    if (forward > 0) bonuses.push({ action: "forward", amount: 1 });
    // Ongoing is situational, so it's applied +1 at a time, up to the actor's total, and never spent.
    if (ongoing > (state.ongoingUsed ?? 0)) bonuses.push({ action: "ongoing", amount: 1 });

    if (state.influenceUsed) {
        if (!state.influenceExploited) {
            bonuses.push({ action: "exploit", amount: 1, ...state.influenceUsed });
        }
    } else {
        const influences = actor.getFlag(MODULE_ID, "influences") ?? [];
        for (const influence of influences) {
            if (!influence.haveInfluenceOver) continue;
            bonuses.push({ action: "influence", amount: 1, influenceId: influence.id, name: influence.name ?? "" });
        }
    }

    return bonuses;
}

/** The roll-bonus state after spending `bonus` on a roll whose state was `state`. */
export function nextBonusState(state = {}, bonus) {
    switch (bonus.action) {
        case "forward":
            return { ...state, forwardUsed: (state.forwardUsed ?? 0) + 1 };
        case "ongoing":
            return { ...state, ongoingUsed: (state.ongoingUsed ?? 0) + 1 };
        case "influence":
            return { ...state, influenceUsed: { influenceId: bonus.influenceId, name: bonus.name } };
        case "exploit":
            return { ...state, influenceExploited: true };
        default:
            return state;
    }
}

export function isBonusRollMessage(message) {
    const roll = message.rolls?.[0];
    return roll instanceof CONFIG.Dice.RollPbtA && !roll.options?.descriptionOnly;
}

/** The actor's most recent roll card, optionally skipping one message (e.g. one just created). */
export function findLatestRoll(messages, actorId, excludeId = null) {
    return messages.findLast(
        (m) => m.id !== excludeId && m.speaker?.actor === actorId && isBonusRollMessage(m)
    ) ?? null;
}
