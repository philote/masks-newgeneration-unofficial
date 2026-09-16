import { createTeamPoolDataModel } from "../data/team-pool-data.mjs";
import { createTeamPoolActorSheet } from "../sheets/team-pool-sheet.mjs";
import { TEAM_ACTOR_TYPE, formatTeamPoolName, adjustTeamPool } from "./team-pool-utils.mjs";

export function initTeamPool() {
    CONFIG.Actor.dataModels[TEAM_ACTOR_TYPE] = createTeamPoolDataModel();

    const TeamPoolActorSheet = createTeamPoolActorSheet();
    const Actors = foundry.documents.collections.Actors;
    Actors.registerSheet("masks-newgeneration-unofficial", TeamPoolActorSheet, {
        types: [TEAM_ACTOR_TYPE],
        makeDefault: true,
        label: "MASKS-SHEETS.SheetConfig.team",
    });

    // pbta's own Actor.createDialog() override defaults its selectable "types" to
    // Object.keys(game.pbta.sheetConfig.actorTypes) and skips anything not a key
    // there (pbta/src/module/documents/actor.js, createDialog) — Foundry's own
    // core-registered type list (game.documentTypes.Actor) is irrelevant to it.
    // getLabel() also indexes actorTypes[type].label with no guard, so this needs
    // a real entry, not just a mention. initTeamPool() itself only runs once the
    // "init" hook fires, which is strictly after masks.mjs's own top-level
    // Hooks.once("pbtaSheetConfig", ...) has already been registered (that one
    // replaces game.pbta.sheetConfig wholesale via configSheet()) — same-event
    // hooks fire in registration order, so this listener is guaranteed to run
    // after configSheet() and can safely add to the object it built.
    Hooks.once("pbtaSheetConfig", () => {
        game.pbta.sheetConfig.actorTypes[TEAM_ACTOR_TYPE] = {
            label: game.i18n.localize("TYPES.Actor.masks-newgeneration-unofficial.team"),
            stats: {},
            attributes: {},
        };
    });

    // Every player needs to increment/decrement the shared Team pool, not just the
    // actor's owner/GM. There's no socket relay in this module, so the simplest way
    // to get there is to make every Team Pool actor OWNER-by-default on creation.
    Hooks.on("preCreateActor", (document) => {
        if (document.type !== TEAM_ACTOR_TYPE) { return; }

        document.updateSource({
            name: formatTeamPoolName(document.name, document.system.pool ?? 0),
            "ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
            prototypeToken: {
                actorLink: true,
                displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
                disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            },
        });
    });

    // Keeps the always-visible token nameplate in sync with the current pool value.
    Hooks.on("updateActor", (actor, changes) => {
        if (actor.type !== TEAM_ACTOR_TYPE) { return; }
        if (foundry.utils.getProperty(changes, "system.pool") === undefined) { return; }

        const nextName = formatTeamPoolName(actor.name, actor.system.pool);
        if (nextName === actor.name) { return; }

        actor.update({ name: nextName });
    });

    // Quick +/- access without opening the sheet. html may be a jQuery-wrapped
    // array (ApplicationV1-era hooks) or a raw HTMLElement (ApplicationV2 HUD),
    // so support both.
    Hooks.on("renderTokenHUD", (hud, html) => {
        const actor = hud.object?.actor;
        if (!actor || actor.type !== TEAM_ACTOR_TYPE) { return; }

        const root = html instanceof HTMLElement ? html : html[0];
        const container = document.createElement("div");
        container.classList.add("control-icon", "team-pool-hud");
        container.innerHTML = `
            <button type="button" class="team-pool-hud__decrease" title="${game.i18n.localize("MASKS-SHEETS.TeamPool.Decrease")}"><i class="fa-solid fa-minus"></i></button>
            <span class="team-pool-hud__value">${actor.system.pool}</span>
            <button type="button" class="team-pool-hud__increase" title="${game.i18n.localize("MASKS-SHEETS.TeamPool.Increase")}"><i class="fa-solid fa-plus"></i></button>
        `;

        container.querySelector(".team-pool-hud__decrease").addEventListener("click", () => adjustTeamPool(actor, -1));
        container.querySelector(".team-pool-hud__increase").addEventListener("click", () => adjustTeamPool(actor, 1));

        (root.querySelector(".col.right") ?? root).prepend(container);
    });
}
