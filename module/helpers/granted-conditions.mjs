/**
 * Conditions that only exist on a sheet once a move grants them, keyed by the
 * name a move's `grantsCondition` flag uses, mapped to the option key under
 * the character `conditions` attribute (see config-sheet.mjs).
 */
export const GRANTED_CONDITION_OPTION_KEYS = {
    Damaged: "5"
};

function grantedConditionNames(items) {
    const names = new Set();
    for (const item of items ?? []) {
        const granted = item?.flags?.["masks-newgeneration-unofficial"]?.grantsCondition;
        if (granted) names.add(granted);
    }
    return names;
}

/**
 * Removes each move-granted condition option from a sheet's render data unless
 * the actor has a move granting it. A still-marked option stays visible so the
 * player can clear it after the granting move is removed.
 */
export function hideUngrantedConditions(conditionsAttr, items) {
    const options = conditionsAttr?.options;
    if (!options) return;

    const granted = grantedConditionNames(items);
    for (const [name, key] of Object.entries(GRANTED_CONDITION_OPTION_KEYS)) {
        if (!(key in options) || granted.has(name) || options[key]?.value) continue;
        delete options[key];
    }
}
