import { ALL_CONDITIONS_MOVE_NAMES, CONDITION_OPTION_KEYS, MOVE_CONDITIONS } from "./move-condition-map.mjs";

/**
 * Like powerful-blow.mjs, the pbta system's roll dialog doesn't expose the
 * source item/flags to this hook, so the dialog's title (which embeds the
 * item name) is the only reliable way to identify the move here.
 */
export function initBasicMoveConditions() {
    Hooks.on("renderDialog", onRenderDialog);
}

// Recovers the raw move name from a dialog title built with
// game.i18n.format("PBTA.RollLabel", { label: moveName }), by formatting the
// same key once with a private-use-area sentinel that can't collide with the
// template's own text, to learn its surrounding prefix/suffix — cheaper than
// formatting a candidate title per known move name, and unaffected by which
// language PBTA.RollLabel is localized into.
const TITLE_SENTINEL = "\uE000";

function extractMoveName(title) {
    const template = game.i18n.format("PBTA.RollLabel", { label: TITLE_SENTINEL });
    const sentinelIndex = template.indexOf(TITLE_SENTINEL);
    if (sentinelIndex === -1) return null;

    const prefix = template.slice(0, sentinelIndex);
    const suffix = template.slice(sentinelIndex + TITLE_SENTINEL.length);
    if (!title.startsWith(prefix) || !title.endsWith(suffix)) return null;

    return title.slice(prefix.length, title.length - suffix.length);
}

// Strips a checkbox/option label's trailing "(-2 to ...)" parenthetical so
// the bare condition name can be compared regardless of locale.
function stripModifier(text) {
    return text.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// basic-move-picker.mjs renames its clone to "<move name> (<chosen basic
// move>)" before rolling, so the condition that applies is whichever basic
// move the player picked, not the wrapping move's own (absent) entry.
function resolveApplicableCondition(moveName) {
    if (!moveName) return undefined;
    if (MOVE_CONDITIONS[moveName]) return MOVE_CONDITIONS[moveName];

    const pickerSuffix = moveName.match(/\(([^()]+)\)$/);
    return pickerSuffix ? MOVE_CONDITIONS[pickerSuffix[1]] : undefined;
}

export { onRenderDialog as applyBasicMoveConditions };

function onRenderDialog(app, html) {
    const root = html[0];
    const conditionsCell = root.querySelector(".cell--conditions");
    if (!conditionsCell) return;

    const moveName = extractMoveName(app?.data?.title ?? "");

    // "Take a Powerful Blow" configures every checkbox itself; leave its
    // dialog alone rather than tearing down what it just set up.
    if (moveName && ALL_CONDITIONS_MOVE_NAMES.includes(moveName)) return;

    const applicableCondition = resolveApplicableCondition(moveName);
    if (!applicableCondition) {
        conditionsCell.remove();
        app.setPosition({ height: "auto" });
        return;
    }

    const checkboxes = conditionsCell.querySelectorAll('input[name="condition"]');
    if (!checkboxes.length) return;

    // The checkbox label is rendered from config-sheet.mjs's own
    // MASKS-SHEETS.CharacterSheets.conditions.options.N localization, so it's
    // never the English "Afraid"/"Angry"/... literal once a non-English
    // locale is active — resolve the expected label through i18n instead of
    // comparing against MOVE_CONDITIONS' English name directly.
    const expectedLabel = stripModifier(
        game.i18n.localize(`MASKS-SHEETS.CharacterSheets.conditions.options.${CONDITION_OPTION_KEYS[applicableCondition]}`)
    );

    let total = 0;
    checkboxes.forEach((checkbox) => {
        const conditionLabel = stripModifier(checkbox.dataset.content ?? "");
        if (conditionLabel === expectedLabel) {
            checkbox.checked = true;
            checkbox.disabled = true;
            total += Number(checkbox.dataset.mod);
        } else {
            checkbox.closest("li").remove();
        }
    });

    if (total) {
        const notes = conditionsCell.querySelector(".notes");
        if (notes) {
            notes.textContent = game.i18n.format("MASKS-SHEETS.Dialog.AutoConditions", { total: String(total) });
        }
    } else {
        conditionsCell.remove();
    }

    // Foundry already fixed the dialog's pixel height (setPosition runs
    // before this hook fires), so removing rows above leaves stale empty
    // space that the buttons row's flex-grow then stretches into. Re-measure
    // now that the content has actually shrunk.
    app.setPosition({ height: "auto" });
}
