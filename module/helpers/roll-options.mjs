import { attributeRollFormula } from "./attribute-roll.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";

/**
 * Some playbook moves fold together several unrelated rolls under one move
 * (e.g. "roll + Memories to remember someone" vs. "roll + Savior to
 * investigate the timeline"), which pbta's own rollType handling has no way
 * to express as a single item. Items that opt in via the "rollOptions" flag
 * (a list of { label, rollType | attributeRollKey, moveResults?, choices? })
 * get a picker dialog on every roll instead; the chosen option's roll
 * behavior and (optionally) display data are baked onto an unsaved clone
 * before handing off to pbta's own, unmodified roll().
 */
export function initRollOptions() {
    const originalRoll = CONFIG.Item.documentClass.prototype.roll;

    CONFIG.Item.documentClass.prototype.roll = async function roll(options = {}) {
        const rollOptions = this.getFlag(MODULE_ID, "rollOptions");
        if (!rollOptions?.length || options.descriptionOnly) {
            return originalRoll.call(this, options);
        }

        const chosen = await promptForRollOption(rollOptions);
        if (!chosen) return null;

        const cloneData = {
            name: `${this.name} (${chosen.label})`
        };

        if (chosen.attributeRollKey) {
            cloneData["system.rollType"] = "formula";
            cloneData["system.rollFormula"] = attributeRollFormula(
                this.actor,
                chosen.attributeRollKey,
                chosen.attributeRollResolver
            );
        } else {
            cloneData["system.rollType"] = chosen.rollType;
        }

        if (chosen.moveResults) cloneData["system.moveResults"] = chosen.moveResults;
        if (chosen.choices) cloneData["system.choices"] = chosen.choices;

        const clone = this.clone(cloneData, { keepId: true });

        return originalRoll.call(clone, options);
    };
}

async function promptForRollOption(rollOptions) {
    const options = rollOptions
        .map((option, index) => `<option value="${index}">${option.label}</option>`)
        .join("");

    const chosenIndex = await foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("MASKS-SHEETS.Dialog.ChooseRollTitle") },
        classes: ["themed", "theme-light"],
        content: `
            <div class="masks-roll-options-dialog">
                <p>${game.i18n.localize("MASKS-SHEETS.Dialog.ChooseRollLabel")}</p>
                <select name="rollOption">${options}</select>
            </div>
        `,
        buttons: [
            {
                action: "submit",
                label: game.i18n.localize("MASKS-SHEETS.Dialog.ChooseRollSubmit"),
                class: "dialog-button",
                default: true,
                callback: (event, button) => button.form.elements.rollOption.value
            }
        ],
        rejectClose: false
    });

    if (chosenIndex === null || chosenIndex === undefined) return null;
    return rollOptions[Number(chosenIndex)];
}
