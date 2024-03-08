import { configSheet } from "./helpers/config-sheet.mjs";

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
});

Hooks.once("init", () => {

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

// Hooks.on("renderActorSheet", async (app, html, context) => {


//     if (app.actor.type === "character") {
        
//         // Label Shift UI
//         const asideElem = html[0].querySelector('.pbta.sheet.actor .stats-list');
//         if (asideElem) {
//             const newItem = await renderTemplate("modules/masks-newgeneration-unofficial/templates/shift.hbs");
//             asideElem.insertAdjacentHTML('beforeend', newItem);
//         }
//     }
// });
