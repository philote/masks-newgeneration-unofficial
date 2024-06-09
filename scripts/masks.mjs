import { configSheet } from "./helpers/config-sheet.mjs";
// import { RollPbtAMasks } from "./helpers/rollsMasks.mjs";

Hooks.once("init", () => {

    // CONFIG.Dice.RollPbtA = RollPbtAMasks;
	// CONFIG.Dice.rolls.push(RollPbtAMasks);

    game.settings.register("masks-newgeneration-unofficial", "enable_dark_mode", {
        name: "MASKS-SHEETS.Settings.enable_dark_mode.name",
        hint: "MASKS-SHEETS.Settings.enable_dark_mode.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: debouncedReload
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

});

Hooks.on('setup', () => {
    // Ensure template is loaded so that it will be ready when needed
    loadTemplates(['modules/masks-newgeneration-unofficial/templates/influences-tab-page.hbs']);
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
    game.settings.set('pbta', 'hideHold', false);
});

Hooks.on("preCreateActor", async function (document) {
    if (document.type === 'character') {
        document.updateSource({'flags.masks-newgeneration-unofficial.influences': []});
    }
});

Hooks.on("renderActorSheet", async (app, html, context) => {
    if (app.actor.type === "character") {
        // rename equipment tab
        const equipmentTabEl = html[0].querySelector('.pbta.sheet.actor .sheet-main [data-tab=equipment]');
        if (equipmentTabEl) {
            equipmentTabEl.innerText = game.i18n.localize("MASKS-SHEETS.Influences");
            
        }

        // Add the influence sheet-tab
        const equipmentEl = html[0].querySelector('.pbta.sheet.actor .sheet-main .sheet-body .equipment .cell--equipment');
        if (equipmentEl) {
            const influenceSheetTemplate = await renderTemplate('modules/masks-newgeneration-unofficial/templates/influences-tab-page.hbs', context);
            equipmentEl.insertAdjacentHTML('beforebegin', influenceSheetTemplate);
        }

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
