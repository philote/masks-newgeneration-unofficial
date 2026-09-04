const MOVE_NAME = "Take a Powerful Blow";

// Unlike every other move, "Take a Powerful Blow" doesn't use the standard
// per-condition -2 penalty: each marked condition adds a flat +1 here instead
// (rules text: "roll + conditions marked" is a positive count, not a debuff).
const MOD_PER_CONDITION = 1;

/**
 * "Take a Powerful Blow" always applies every currently marked condition
 * rather than letting the player opt into a subset via the system's normal
 * per-move checkboxes. The pbta system's roll dialog doesn't expose the
 * source item/flags to this hook, so the dialog's title (which embeds the
 * item name) is the only reliable way to identify it here.
 */
export function initPowerfulBlow() {
    Hooks.on("renderDialog", onRenderDialog);
}

function onRenderDialog(app, html) {
    const expectedTitle = game.i18n.format("PBTA.RollLabel", { label: MOVE_NAME });
    if (app?.data?.title !== expectedTitle) return;

    const root = html[0];
    const conditionsCell = root.querySelector(".cell--conditions");
    if (!conditionsCell) return;

    const checkboxes = conditionsCell.querySelectorAll('input[name="condition"]');
    if (!checkboxes.length) return;

    checkboxes.forEach((checkbox) => {
        // Overwrite the standard -2 penalty data before pbta's own
        // _onDialogSubmit reads it, so the existing summation logic adds
        // +1 per marked condition instead of the usual debuff.
        const label = (checkbox.dataset.content ?? "").replace(/\s*\([^)]*\)\s*$/, "");
        checkbox.dataset.mod = String(MOD_PER_CONDITION);
        checkbox.dataset.content = `${label} (+${MOD_PER_CONDITION})`;
        checkbox.checked = true;
        checkbox.disabled = true;
    });

    const total = checkboxes.length * MOD_PER_CONDITION;

    const notes = conditionsCell.querySelector(".notes");
    if (notes) {
        notes.textContent = game.i18n.format("MASKS-SHEETS.Dialog.AutoConditions", { total: `+${total}` });
    }
}
