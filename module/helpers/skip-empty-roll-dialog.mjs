import { applyPowerfulBlowConditions } from "./powerful-blow.mjs";
import { applyBasicMoveConditions } from "./basic-move-conditions.mjs";

/**
 * Masks has no preroll dialog for situational modifiers: forward, ongoing and
 * Influence are offered as buttons on the posted chat card instead (see
 * roll-bonuses.mjs). So this zeroes forward/ongoing/hold in the roll's data
 * before pbta's configureDialog() sees them — which both stops them triggering
 * a dialog and keeps their checkboxes out of the "ask" stat-picker dialog,
 * the one pbta dialog that remains (a genuine Label choice).
 *
 * pbta also shows a dialog whenever the actor has ANY condition marked, even
 * though basic-move-conditions.mjs and powerful-blow.mjs always force every
 * checkbox to checked+disabled or remove the whole cell the instant that dialog
 * renders. Suppressing that isn't purely cosmetic though: pbta's
 * _onDialogSubmit() is the only place a condition's modifier actually gets
 * folded into the roll formula. So when conditions are the only reason a dialog
 * would show, this replicates configureDialog()'s own pre-dialog setup, renders
 * the real template, runs the two condition-lockdown handlers directly (in the
 * same order their renderDialog hooks fire), and calls the real
 * _onDialogSubmit() itself — never constructing a Dialog.
 */
export function initSkipEmptyRollDialog() {
    const originalConfigureDialog = CONFIG.Dice.RollPbtA.prototype.configureDialog;

    CONFIG.Dice.RollPbtA.prototype.configureDialog = async function configureDialog(data = {}, options = {}) {
        if (this.data.resources) {
            this.data = { ...this.data, resources: withoutSituationalMods(this.data.resources) };
        }

        const { conditionGroups, resources, rollType } = this.data;
        const templateData = data.templateData ?? {};
        const hasOtherRealChoice =
            ["ask", "prompt"].includes(rollType)
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

function withoutSituationalMods(resources) {
    return {
        ...resources,
        forward: { ...resources.forward, value: 0 },
        ongoing: { ...resources.ongoing, value: 0 },
        hold: { ...resources.hold, value: 0 }
    };
}
