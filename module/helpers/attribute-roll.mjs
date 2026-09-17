const MODULE_ID = "masks-newgeneration-unofficial";

const ATTRIBUTE_VALUE_RESOLVERS = {
    value: (attribute) => Number(attribute?.value) || 0,
    highestCheckedCount: (attribute) => {
        const options = Object.values(attribute?.options ?? {});
        if (!options.length) return 0;

        return Math.max(
            ...options.map((option) =>
                Object.values(option.values ?? {}).filter((value) => value?.value === true).length
            ),
            0
        );
    }
};

/**
 * Some playbook moves roll + a playbook-specific Label that lives in the
 * actor's attributes bag (e.g. system.attributes.theSoldier) rather than one
 * of pbta's five core stats, so pbta's own rollType handling (including its
 * "ask"/"prompt" stat-picker) has no way to roll against it directly. Other
 * attributes (e.g. system.attributes.theReformed) aren't a single number but
 * a checkbox grid, so resolving "the value to roll with" needs a named
 * strategy rather than always reading ".value" directly.
 */
export function attributeRollFormula(actor, attributeKey, resolver = "value") {
    const attribute = actor?.system?.attributes?.[attributeKey];
    const resolve = ATTRIBUTE_VALUE_RESOLVERS[resolver] ?? ATTRIBUTE_VALUE_RESOLVERS.value;
    const modifier = resolve(attribute);
    const sign = modifier < 0 ? "-" : "+";

    return `2d6 ${sign} ${Math.abs(modifier)}`;
}

/**
 * Items that opt in via the "attributeRollKey" flag (and optionally
 * "attributeRollResolver", for non-numeric attributes) get the actor's
 * current attribute value baked into a "formula" roll on an unsaved clone
 * before handing off to pbta's own, unmodified roll().
 */
export function initAttributeRoll() {
    const originalRoll = CONFIG.Item.documentClass.prototype.roll;

    CONFIG.Item.documentClass.prototype.roll = async function roll(options = {}) {
        const attributeKey = this.getFlag(MODULE_ID, "attributeRollKey");
        if (!attributeKey || !this.actor || options.descriptionOnly) {
            return originalRoll.call(this, options);
        }

        const resolver = this.getFlag(MODULE_ID, "attributeRollResolver") || "value";
        const rollFormula = attributeRollFormula(this.actor, attributeKey, resolver);
        const clone = this.clone({ "system.rollFormula": rollFormula }, { keepId: true });

        return originalRoll.call(clone, options);
    };
}
