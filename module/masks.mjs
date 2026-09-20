import { configSheet } from "./helpers/config-sheet.mjs";
import * as utils from "./helpers/utils.mjs";
import { MasksActorSheetMixin } from './sheets/actor-sheet.mjs';
import { initPowerfulBlow } from './helpers/powerful-blow.mjs';
import { initBasicMoveConditions } from './helpers/basic-move-conditions.mjs';
import { initMovePicker } from './helpers/move-picker.mjs';
import { initBasicMovePicker } from './helpers/basic-move-picker.mjs';
import { initSkipEmptyRollDialog } from './helpers/skip-empty-roll-dialog.mjs';
import { initTeamPool } from './helpers/team-pool.mjs';
import { initMarkPotentialButton } from './helpers/mark-potential.mjs';
import { initAttributeRoll } from './helpers/attribute-roll.mjs';
import { initRollOptions } from './helpers/roll-options.mjs';
import { initLabelSwap } from './helpers/label-swap.mjs';
import { initTheme } from './helpers/theme.mjs';
import { initLoginBackground, promptLoginBackgroundOnce } from './helpers/login-background.mjs';
import { migrateTakeAPowerfulBlow, migrateRejectingInfluence, migrateBurn, migrateNoPowersBasicMoveChoices, migrateKirbyCraftBasicMoveChoices, migrateWheneverTimePasses, migrateAHigherCalling, migrateFriendsInLowPlaces, migrateLegacy, migrateConnectingTheDots, migrateAllTheBestStuff, migrateAHigherCallingLabelSwap, migrateDuplicateChoiceLists } from './helpers/migrations.mjs';

Hooks.once("init", () => {
    const masksActorSheet = MasksActorSheetMixin(game.pbta.applications.actor.PbtaActorSheet);
    const Actors = foundry.documents.collections.Actors;
    Actors.unregisterSheet('pbta', game.pbta.applications.actor.PbtaActorSheet, { types: ['character'] });
    Actors.registerSheet('pbta', masksActorSheet, {
        types: ['character'],
        makeDefault: true,
        label: 'MASKS-SHEETS.SheetConfig.character',
    });

    initTheme();
    initLoginBackground();

    // Preload Handlebars stuff.
    utils.preloadHandlebarsTemplates();

    initPowerfulBlow();
    initBasicMoveConditions();
    initMovePicker();
    // Each of these four wraps CONFIG.Item.documentClass.prototype.roll around
    // whatever the previous one left behind, so call order here is load-bearing:
    // the first called becomes the innermost wrapper (closest to pbta's own
    // roll()), the last called becomes the outermost (runs its own check first).
    // initLabelSwap must run before the pickers so a picker's renamed/retyped
    // clone (e.g. Kirby-Craft, a roll-options choice) still gets offered the
    // Soldier swap; initAttributeRoll must run last so a move's own fixed
    // "formula" roll (e.g. A Higher Calling) is never intercepted by the swap.
    initLabelSwap();
    initBasicMovePicker();
    initSkipEmptyRollDialog();
    initTeamPool();
    initMarkPotentialButton();
    initRollOptions();
    initAttributeRoll();
});

Hooks.once('ready', async function () {
    if (!game.user.isGM) return;

    await migrateTakeAPowerfulBlow();
    await migrateRejectingInfluence();
    await migrateBurn();
    await migrateNoPowersBasicMoveChoices();
    await migrateKirbyCraftBasicMoveChoices();
    await migrateWheneverTimePasses();
    await migrateAHigherCalling();
    await migrateFriendsInLowPlaces();
    await migrateLegacy();
    await migrateConnectingTheDots();
    await migrateAllTheBestStuff();
    await migrateAHigherCallingLabelSwap();
    await migrateDuplicateChoiceLists();
    await promptLoginBackgroundOnce();
});

Hooks.once('pbtaSheetConfig', () => {
    // Disable the sheet config form.
    game.settings.set('pbta', 'sheetConfigOverride', true);

    // Replace the game.pbta.sheetConfig with your own version.
    configSheet();

    // PBTA Settings
    game.settings.set('pbta', 'advForward', false);
    game.settings.set('pbta', 'hideRollFormula', true);
    game.settings.set('pbta', 'hideForward', false);
    game.settings.set('pbta', 'hideOngoing', false);
    game.settings.set('pbta', 'hideRollMode', true);
    game.settings.set('pbta', 'hideUses', true);
    
    if (game.settings.settings.has('pbta.hideAdvancement')) {
        game.settings.set('pbta', 'hideAdvancement', "both");
    }

    if (game.settings.settings.has('pbta.hideHold')) {
        game.settings.set('pbta', 'hideHold', true);
    }
});

Hooks.on("preCreateActor", function (document, data, options, userId) {
    if (document.type === 'character') {
        document.updateSource({'flags.masks-newgeneration-unofficial.influences': []});
    }
});

// "renderActorSheet" and the jQuery `html[0]` access below only fire because PbtA's
// actor sheet is still ApplicationV1 (see game.pbta.applications.actor.PbtaActorSheet).
// If PbtA migrates to ApplicationV2, this hook renames to "renderActorSheetV2" and
// `html` becomes a raw HTMLElement — this whole Influences feature would then silently
// stop firing with no error.
Hooks.on("renderActorSheet", async (app, html) => {
    if (app.actor.type === "character") {

        // Create influence list and enable influence tab interactivity
        onInfluenceCreate(app.actor, html);
        const influenceNameInputs = html[0].querySelectorAll('.influence--name');
        influenceNameInputs.forEach(input => {
            input.addEventListener('change', async function(event) {
                onInfluenceEdit(app.actor, event);
            });
        });
        onInfluenceAction(app.actor, html);
    }
});

function onInfluenceCreate(actor, html) {
    let create = html[0].querySelector('.influence-create');
    if (!create) { return; }
    create.addEventListener('click', async function(event) {
        event.preventDefault();

        let item = {
            "id": foundry.utils.randomID(),
            "name": "",
            "hasInfluenceOver": false,
            "haveInfluenceOver": false,
            "locked": false
        }

        let influences = actor.getFlag("masks-newgeneration-unofficial", "influences") ?? [];
        influences.push(item);
        actor.setFlag("masks-newgeneration-unofficial", "influences", influences);
    });
}

async function onInfluenceEdit(actor, event) {
    event.preventDefault();
    let element = event.target;
    while (element && !element.hasAttribute('data-influence-id')) {
        element = element.parentElement;
    }
    let influenceID = element ? element.dataset.influenceId : null;
    let influences = actor.getFlag("masks-newgeneration-unofficial", "influences");
    let influence = influences.find(i => i.id === influenceID);
    influence.name = event.target.value;

    actor.setFlag("masks-newgeneration-unofficial", "influences", influences);
}

function onInfluenceAction(actor, html) {
    let actions = html[0].querySelectorAll('[data-influence-action]');
    if (!actions.length) { return; }
    actions.forEach(action => {
        action.addEventListener('click', async function(event) {
        event.preventDefault();
        
        const clickedElement = event.currentTarget;
        const action = clickedElement.dataset.influenceAction;
        
        let element = clickedElement;
        while (element && !element.hasAttribute('data-influence-id')) {
            element = element.parentElement;
        }
        let influenceID = element ? element.dataset.influenceId : null;
        let influences = actor.getFlag("masks-newgeneration-unofficial", "influences") ?? [];
        let influence = influences.find(i => i.id === influenceID);

        if (influence.locked && /lock|roll/.exec(action) === null) {
            return;
        }

        switch (action) {
            case "hasInfluenceOver":
                influence.hasInfluenceOver = !influence.hasInfluenceOver;
                break;
            case "haveInfluenceOver":
                influence.haveInfluenceOver = !influence.haveInfluenceOver;
                break;
            case "lock":
                influence.locked = !influence.locked;
                break;
            case "delete":
                influences = influences.filter(i => i.id !== influence.id);
                break;
            default:
                break;
        }

        await actor.setFlag("masks-newgeneration-unofficial", "influences", influences);
        });
    });
}

Hooks.on("renderSettings", (app, html) => {
    // --- Setting Module Configuration
    const MODULE_CONFIG = {
        headingKey: "MASKS-SHEETS.Settings.game.heading",
        sectionClass: "masks-doc",
        buttonsData: [
            {
                action: (ev) => {
                    ev.preventDefault();
                    const publisherUrl = game.i18n.localize("MASKS-SHEETS.Settings.game.publisher.url");
                    window.open(publisherUrl, "_blank");
                },
                iconClasses: ["fa-solid", "fa-book"],
                labelKey: "MASKS-SHEETS.Settings.game.publisher.title",
            },
            {
                action: (ev) => {
                    ev.preventDefault();
                    window.open("https://github.com/philote/masks-newgeneration-unofficial", "_blank");
                },
                iconClasses: ["fab", "fa-github"],
                labelKey: "MASKS-SHEETS.Settings.game.github.title",
            },
        ]
    };

    // --- Button Creation Logic 
    const buttons = MODULE_CONFIG.buttonsData.map(({ action, iconClasses, labelKey }) => {
        const button = document.createElement("button");
        button.type = "button";

        const icon = document.createElement("i");
        icon.classList.add(...iconClasses);

        // Append icon and localized text node
        button.append(icon, document.createTextNode(` ${game.i18n.localize(labelKey)}`));

        button.addEventListener("click", action);
        return button;
    });
    
    // --- Insert after the "Documentation" section
    const documentationSection = html.querySelector("section.documentation");
    if (documentationSection) {
        // Create section wrapper
        const section = document.createElement("section");
        section.classList.add(MODULE_CONFIG.sectionClass, "flexcol");

        const divider = document.createElement("h4");
        divider.classList.add("divider");
        divider.textContent = game.i18n.localize(MODULE_CONFIG.headingKey);

        // Append divider and buttons to section
        section.append(divider, ...buttons);

        // Insert section before documentation
        documentationSection.before(section);
    } else {
        console.warn(`${game.i18n.localize(MODULE_CONFIG.headingKey)} | Could not find 'section.documentation' in settings panel.`);
    }
});
