import { configSheet } from "./helpers/config-sheet.mjs";
import * as utils from "./helpers/utils.mjs";
import { MasksActorSheetMixin } from './sheets/actor-sheet.mjs';
// import { RollPbtAMasks } from "./helpers/rollsMasks.mjs";

Hooks.once("init", () => {

    // CONFIG.Dice.RollPbtA = RollPbtAMasks;
	// CONFIG.Dice.rolls.push(RollPbtAMasks);

    const masksActorSheet = MasksActorSheetMixin(game.pbta.applications.actor.PbtaActorSheet);
    Actors.unregisterSheet('pbta', game.pbta.applications.actor.PbtaActorSheet, { types: ['character'] });
    Actors.registerSheet('pbta', masksActorSheet, {
        types: ['character'],
        makeDefault: true,
        label: 'MASKS-SHEETS.SheetConfig.character',
    });

    game.settings.register("masks-newgeneration-unofficial", "enable_dark_mode", {
        name: "MASKS-SHEETS.Settings.enable_dark_mode.name",
        hint: "MASKS-SHEETS.Settings.enable_dark_mode.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        requiresReload: true
    });

    var head = document.getElementsByTagName('HEAD')[0];
    if (game.settings.get("masks-newgeneration-unofficial","enable_dark_mode")){
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = './modules/masks-newgeneration-unofficial/css/dark-mode.css';
		//Append link element to HTML head
		head.appendChild(link);
	}

    // Register settings
    game.settings.register('masks-newgeneration-unofficial', 'firstTime', {
        name: 'First Time Startup',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });

    // Preload Handlebars stuff.
    utils.preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
    if (!game.user.isGM) return;
    if (game.settings.get('masks-newgeneration-unofficial', 'firstTime')) {
        game.settings.set('masks-newgeneration-unofficial', 'firstTime', false);

        const callback = async () => {
            game.settings.set('masks-newgeneration-unofficial', 'firstTime', true);
            const worldData = {
                id: game.world.id,
                action: 'editWorld',
                background: `modules/masks-newgeneration-unofficial/images/login-bg-lt.webp`,
            };
            let response;
            try {
                response = await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute('setup'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(worldData),
                });
                if (response.error) {
                        ui.notifications.error(response.error);
                } else if (!response) {
                        game.world.updateSource(response);
                }
            } catch (e) {
                return ui.notifications.error(e);
            }
        };

        foundry.applications.api.DialogV2.confirm({
            window: { title: 'Welcome to Masks: A New Generation!' },
            content: '<p>Would you like to use a Masks theme for your login screen?</p>',
            rejectClose: false,
            modal: true,
            yes: { callback: callback },
        });
    } else {
        if (game.settings.get('masks-newgeneration-unofficial', 'enableLoginImg')) {
            const worldData = {
                id: game.world.id,
                action: 'editWorld',
                background: `modules/masks-newgeneration-unofficial/images/login-bg-lt.webp`,
            };
            let response;
            try {
                response = await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute('setup'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(worldData),
                });
                if (response.error) {
                    ui.notifications.error(response.error);
                } else if (!response) {
                    game.world.updateSource(response);
                }
            } catch (e) {
              return ui.notifications.error(e);
            }
        }
    }
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

Hooks.on("preCreateActor", async function (document) {
    if (document.type === 'character') {
        document.updateSource({'flags.masks-newgeneration-unofficial.influences': []});
    }
});

Hooks.on("renderActorSheet", async (app, html) => {
    if (app.actor.type === "character") {

        // Create influence list and enable influence tab interactivity
        onInfluenceCreate(app.actor, html);
        html.find('.influence--name').on('change', async function(event) {
            onInfluenceEdit(app.actor, event);
        });
        onInfluenceAction(app.actor, html);
    }
});

function onInfluenceCreate(actor, html) {
    let create = html.find('.influence-create');
    if (!create) { return; }
    create.click(async function(event) {
        event.preventDefault();

        let item = {
            "id": foundry.utils.randomID(),
            "name": "",
            "hasInfluenceOver": false,
            "haveInfluenceOver": false,
            "locked": false
        }

        let influences = actor.getFlag("masks-newgeneration-unofficial", "influences");
        influences.push(item);
        actor.setFlag("masks-newgeneration-unofficial", "influences", influences);
    });
}

async function onInfluenceEdit(actor, event) {
    event.preventDefault();
    let influenceID = $(event.target).parents("[data-influence-id]").data().influenceId;
    let influences = actor.getFlag("masks-newgeneration-unofficial", "influences");
    let influence = influences.find(i => i.id === influenceID);
    influence.name = event.target.value;

    actor.setFlag("masks-newgeneration-unofficial", "influences", influences);
}

function onInfluenceAction(actor, html) {
    let action = html.find('[data-influence-action]');
    if (!action) { return; }
    action.click(async function(event) {
        event.preventDefault();
        
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().influenceAction;
        let influenceID = clickedElement.parents("[data-influence-id]").data().influenceId;
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
}
