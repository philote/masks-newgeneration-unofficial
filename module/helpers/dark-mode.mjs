export function initDarkMode() {
    game.settings.register("masks-newgeneration-unofficial", "enable_dark_mode", {
        name: "MASKS-SHEETS.Settings.enable_dark_mode.name",
        hint: "MASKS-SHEETS.Settings.enable_dark_mode.hint",
        scope: "client",
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
        link.href = foundry.utils.getRoute('modules/masks-newgeneration-unofficial/css/dark-mode.css');
        //Append link element to HTML head
        head.appendChild(link);
    }
}
