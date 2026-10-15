const MODULE_ID = "masks-newgeneration-unofficial";

export const ALLOW_CUSTOM_PLAYBOOKS_SETTING = "allowCustomPlaybooks";
export const CUSTOM_PLAYBOOK_PACK = "custom-playbook";
const CUSTOM_PLAYBOOK_UUID_PREFIX = `Compendium.${MODULE_ID}.${CUSTOM_PLAYBOOK_PACK}.`;

export function registerCustomPlaybookSetting() {
    game.settings.register(MODULE_ID, ALLOW_CUSTOM_PLAYBOOKS_SETTING, {
        name: "MASKS-SHEETS.Settings.allow_custom_playbooks.name",
        hint: "MASKS-SHEETS.Settings.allow_custom_playbooks.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: rerenderCharacterSheets,
    });
}

export function customPlaybooksAllowed() {
    return game.settings.get(MODULE_ID, ALLOW_CUSTOM_PLAYBOOKS_SETTING);
}

export function isCustomPlaybookUuid(uuid) {
    return typeof uuid === "string" && uuid.startsWith(CUSTOM_PLAYBOOK_UUID_PREFIX);
}

// An actor already on the Custom playbook keeps it listed, or its dropdown would render blank.
export function filterPlaybookChoices(playbooks, currentUuid) {
    if (customPlaybooksAllowed()) return playbooks;
    return playbooks.filter((playbook) => !isCustomPlaybookUuid(playbook.uuid) || playbook.uuid === currentUuid);
}

function rerenderCharacterSheets() {
    for (const app of Object.values(ui.windows)) {
        if (app.actor?.type === "character") app.render(false);
    }
}
