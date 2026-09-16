import { applyPowerfulBlowConditions } from "./powerful-blow.mjs";
import { applyBasicMoveConditions } from "./basic-move-conditions.mjs";

/**
 * pbta's configureDialog() shows a dialog whenever the actor has ANY condition
 * marked (conditionGroups.length > 0), even though basic-move-conditions.mjs and
 * powerful-blow.mjs always force every checkbox to checked+disabled or remove the
 * whole cell the instant that dialog renders — there's never anything left for the
 * player to click. The other three triggers (ask/prompt rollType, banked
 * forward/ongoing/hold, stat-token spend) are all genuine choices and must keep
 * showing a dialog.
 *
 * Suppressing the condition trigger isn't purely cosmetic though: pbta's
 * _onDialogSubmit() is the only place a condition's modifier actually gets folded
 * into the roll formula, so this can't just force needsDialog to false. Instead,
 * when conditions are the only reason a dialog would show, this replicates
 * configureDialog()'s own pre-dialog setup, renders the real template, runs the two
 * condition-lockdown handlers directly (in the same order their renderDialog hooks
 * fire), and calls the real _onDialogSubmit() itself — never constructing a Dialog.
 */
export function initSkipEmptyRollDialog() {
    const originalConfigureDialog = CONFIG.Dice.RollPbtA.prototype.configureDialog;

    CONFIG.Dice.RollPbtA.prototype.configureDialog = async function configureDialog(data = {}, options = {}) {
        const { conditionGroups, resources, rollType } = this.data;
        const hasSituationalMods = resources
            ? resources.forward.value !== 0 || resources.ongoing.value !== 0 || resources.hold.value > 0
            : false;
        const templateData = data.templateData ?? {};
        const hasOtherRealChoice =
            ["ask", "prompt"].includes(rollType)
            || hasSituationalMods
            || (templateData.isStatToken && templateData.numOfToken);

        if (hasOtherRealChoice || !conditionGroups?.length) {
            return originalConfigureDialog.call(this, data, options);
        }

        // Mirrors rolls.js's configureDialog(): _onDialogSubmit() pushes into
        // options.conditions/conditionsConsumed, and the chat card reads options.title.
        this.options.title = data.title;
        this.options.conditions = [];
        this.options.conditionsConsumed = [];

        const mergedTemplateData = foundry.utils.mergeObject(templateData, {
            conditionGroups,
            hasPrompt: false,
            hasSituationalMods: false,
            resources
        });
        const content = await foundry.applications.handlebars.renderTemplate(
            data.template ?? this.constructor.EVALUATION_TEMPLATE,
            mergedTemplateData
        );
        const container = document.createElement("div");
        container.innerHTML = content;

        const title = data.title
            ? game.i18n.format("PBTA.RollLabel", { label: data.title })
            : game.i18n.localize("PBTA.RollMove");
        const fakeApp = { data: { title }, setPosition() {} };

        // Same order masks.mjs registers their renderDialog hooks in: powerful-blow
        // first, then basic-move-conditions (which assumes powerful-blow already ran).
        applyPowerfulBlowConditions(fakeApp, [container]);
        applyBasicMoveConditions(fakeApp, [container]);

        return this._onDialogSubmit([container]);
    };
}
