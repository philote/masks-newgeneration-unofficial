const MODULE_ID = "masks-newgeneration-unofficial";

/**
 * Some playbook moves (e.g. "No Powers and Not Nearly Enough Training") let a
 * character roll one of several basic moves under their own label, but pbta
 * has no concept of "this item's roll should show a different item's
 * results" — moveResults/choices/description are read once, straight off
 * this item, with no hook in between. Items that opt in via the
 * "basicMoveChoices" flag (a list of basic-move UUIDs) get a picker dialog
 * on every roll instead; the chosen move's display data is copied onto an
 * unsaved clone (keeping the real item's id/rollType/stat untouched) before
 * handing off to pbta's own, unmodified roll().
 */
export function initBasicMovePicker() {
    const originalRoll = CONFIG.Item.documentClass.prototype.roll;

    CONFIG.Item.documentClass.prototype.roll = async function roll(options = {}) {
        const choiceUuids = this.getFlag(MODULE_ID, "basicMoveChoices");
        if (!choiceUuids?.length || options.descriptionOnly) {
            return originalRoll.call(this, options);
        }

        const chosen = await promptForBasicMove(choiceUuids);
        if (!chosen) return null;

        const clone = this.clone(
            {
                name: `${this.name} (${chosen.name})`,
                "system.description": chosen.system.description,
                "system.choices": chosen.system.choices,
                "system.moveResults": chosen.system.moveResults
            },
            { keepId: true }
        );

        return originalRoll.call(clone, options);
    };
}

async function promptForBasicMove(choiceUuids) {
    const moves = (await Promise.all(choiceUuids.map((uuid) => fromUuid(uuid)))).filter(Boolean);
    if (!moves.length) return null;

    const options = moves
        .map((move, index) => `<option value="${index}">${move.name}</option>`)
        .join("");

    const chosenIndex = await foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("MASKS-SHEETS.Dialog.ChooseMoveTitle") },
        classes: ["themed", "theme-light"],
        content: `
            <div class="masks-basic-move-picker-dialog">
                <p>${game.i18n.localize("MASKS-SHEETS.Dialog.ChooseMoveLabel")}</p>
                <select name="move">${options}</select>
            </div>
        `,
        buttons: [
            {
                action: "submit",
                label: game.i18n.localize("MASKS-SHEETS.Dialog.ChooseMoveSubmit"),
                class: "dialog-button",
                default: true,
                callback: (event, button) => button.form.elements.move.value
            }
        ],
        rejectClose: false
    });

    if (chosenIndex === null || chosenIndex === undefined) return null;
    return moves[Number(chosenIndex)];
}
