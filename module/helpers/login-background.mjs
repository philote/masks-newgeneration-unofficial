const MODULE_ID = "masks-newgeneration-unofficial";
const LOGIN_BACKGROUND = `modules/${MODULE_ID}/images/login-bg-lt.webp`;

export function initLoginBackground() {
    game.settings.register(MODULE_ID, 'firstTime', {
        name: 'First Time Startup',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });
}

async function applyLoginBackground() {
    const worldData = {
        id: game.world.id,
        action: 'editWorld',
        background: LOGIN_BACKGROUND,
    };
    let response;
    try {
        response = await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute('setup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(worldData),
        });
        if (response && response.error) {
            ui.notifications.error(response.error);
        } else if (response) {
            game.world.updateSource(response);
        }
    } catch (e) {
        return ui.notifications.error(e);
    }
}

/**
 * `firstTime` is cleared before the dialog opens and is never set back to true — an
 * earlier version re-armed it from the "yes" callback, which re-asked on every single
 * world load (issue #9). Clearing it up front also covers a dismissed or crashed dialog.
 */
export async function promptLoginBackgroundOnce() {
    if (!game.settings.get(MODULE_ID, 'firstTime')) return;
    await game.settings.set(MODULE_ID, 'firstTime', false);

    await foundry.applications.api.DialogV2.confirm({
        window: { title: 'Welcome to Masks: A New Generation!' },
        content: '<p>Would you like to use a Masks theme for your login screen?</p>',
        rejectClose: false,
        modal: true,
        yes: { callback: applyLoginBackground },
    });
}
