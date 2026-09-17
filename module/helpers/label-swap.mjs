import { attributeRollFormula } from "./attribute-roll.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";
const CORE_STATS = ["danger", "freak", "savior", "superior", "mundane"];

/**
 * Items that opt in via the "labelSwap" flag (attached to whichever move
 * grants the rule, e.g. the Soldier's "A Higher Calling") let the actor
 * choose, on any other eligible basic/playbook move, to roll with that
 * flagged attribute's value instead of the move's own Label. The flag shape
 * is generic so any future playbook can reuse this same mechanism by
 * attaching a same-shaped flag to its own move.
 */
export function initLabelSwap() {
    const originalRoll = CONFIG.Item.documentClass.prototype.roll;

    CONFIG.Item.documentClass.prototype.roll = async function roll(options = {}) {
        if (options.descriptionOnly || !this.actor) {
            return originalRoll.call(this, options);
        }

        const swapSource = this.actor.items.find((i) => i.getFlag(MODULE_ID, "labelSwap"));
        if (!swapSource) {
            return originalRoll.call(this, options);
        }

        const { attributeKey, moveTypes, reminderText } = swapSource.getFlag(MODULE_ID, "labelSwap");

        // A "formula" rollType (e.g. the swap source's own moves) has no Label
        // to swap out, and "prompt"/empty rollTypes have no Label either, so
        // restricting eligibility to the 5 core stats plus "ask" excludes all
        // of those with no extra special-casing needed.
        const isEligible =
            moveTypes.includes(this.system.moveType) &&
            (CORE_STATS.includes(this.system.rollType) || this.system.rollType === "ask");
        if (!isEligible) {
            return originalRoll.call(this, options);
        }

        const action = await promptForLabelChoice(this.actor, this.system.rollType, attributeKey);
        if (!action) return null;

        if (action === "normal") {
            return originalRoll.call(this, options);
        }

        const cloneData = {
            "system.rollType": "formula",
            "system.rollFormula": attributeRollFormula(this.actor, attributeKey)
        };
        if (reminderText) {
            cloneData["system.choices"] = `<p>${reminderText}</p>${this.system.choices ?? ""}`;
        }

        // Keep the same name as the original item (no rename) so
        // basic-move-conditions.mjs's exact-name matching still finds the
        // right condition penalty for the move actually being rolled.
        const clone = this.clone(cloneData, { keepId: true });

        return originalRoll.call(clone, options);
    };
}

function formatSignedLabel(label, value) {
    const numeric = Number(value) || 0;
    const sign = numeric < 0 ? "-" : "+";
    const formatted = game.i18n.format("MASKS-SHEETS.Dialog.LabelSwapUse", { label });
    return `${formatted} (${sign}${Math.abs(numeric)})`;
}

async function promptForLabelChoice(actor, rollType, attributeKey) {
    const normalLabel =
        rollType === "ask"
            ? game.i18n.localize("MASKS-SHEETS.Dialog.LabelSwapAsk")
            : formatSignedLabel(actor.system.stats[rollType].label, actor.system.stats[rollType].value);

    const swapAttribute = actor.system.attributes[attributeKey];
    const swapLabel = formatSignedLabel(swapAttribute.label, swapAttribute.value);

    return foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("MASKS-SHEETS.Dialog.LabelSwapTitle") },
        classes: ["themed", "theme-light"],
        content: `<div class="masks-label-swap-dialog"><p>${game.i18n.localize("MASKS-SHEETS.Dialog.LabelSwapPrompt")}</p></div>`,
        buttons: [
            {
                action: "normal",
                label: normalLabel,
                class: "dialog-button",
                default: true,
                callback: () => "normal"
            },
            {
                action: "swap",
                label: swapLabel,
                class: "dialog-button",
                callback: () => "swap"
            }
        ],
        rejectClose: false
    });
}
