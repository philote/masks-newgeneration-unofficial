import { MOVES_THAT_MARK_POTENTIAL_ON_FAILURE } from "./move-potential-map.mjs";

/**
 * Whether a "Mark Potential" button should be offered for this roll.
 * @param {string} itemName The rolled move Item's name.
 * @param {boolean} isFailure Whether the roll's classified result was a miss.
 */
export function shouldOfferMarkPotential(itemName, isFailure) {
    return isFailure && MOVES_THAT_MARK_POTENTIAL_ON_FAILURE.has(itemName);
}

/**
 * The actor's Potential (Xp) attribute object, or undefined for actors
 * (e.g. NPCs, the Team Pool) that don't have one.
 */
export function getPotentialAttribute(actor) {
    return actor?.system?.attributes?.xp;
}

export function isPotentialFull(xp) {
    return xp.value >= xp.max;
}

/**
 * Marks Potential on the actor, clamped to its max. No-ops if already full.
 * Mirrors the pbta system's own sheet clock control (actor-sheet.js
 * _onClockClick), which updates the whole attribute object rather than
 * just its `value` sub-path.
 */
export async function markPotential(actor) {
    const xp = getPotentialAttribute(actor);
    if (!xp || isPotentialFull(xp)) return;

    await actor.update({
        "system.attributes.xp": { ...xp, value: Math.min(xp.value + 1, xp.max) },
    });
}
