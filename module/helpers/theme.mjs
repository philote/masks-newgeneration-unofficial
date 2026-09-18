const MODULE_ID = "masks-newgeneration-unofficial";

/**
 * Palette keys must match the $masks-dark-themes map in src/scss/dark-mode.scss.
 */
export const DARK_THEMES = [
    { key: "indigo", labelKey: "MASKS-SHEETS.Settings.dark_theme.choices.indigo" },
    { key: "teal", labelKey: "MASKS-SHEETS.Settings.dark_theme.choices.teal" },
    { key: "navy", labelKey: "MASKS-SHEETS.Settings.dark_theme.choices.navy" },
    { key: "graphite", labelKey: "MASKS-SHEETS.Settings.dark_theme.choices.graphite" },
    { key: "auburn", labelKey: "MASKS-SHEETS.Settings.dark_theme.choices.auburn" }
];

export const DEFAULT_DARK_THEME = "indigo";

/**
 * Palette keys must match the $masks-light-themes map in src/scss/light-mode.scss —
 * except CLASSIC_LIGHT_THEME, which has no block there because it is the bare :root
 * default in masks-sheets.scss.
 */
export const LIGHT_THEMES = [
    { key: "classic", labelKey: "MASKS-SHEETS.Settings.light_theme.choices.classic" },
    { key: "dusk", labelKey: "MASKS-SHEETS.Settings.light_theme.choices.dusk" },
    { key: "verdant", labelKey: "MASKS-SHEETS.Settings.light_theme.choices.verdant" },
    { key: "overcast", labelKey: "MASKS-SHEETS.Settings.light_theme.choices.overcast" },
    { key: "ink", labelKey: "MASKS-SHEETS.Settings.light_theme.choices.ink" }
];

export const CLASSIC_LIGHT_THEME = "classic";
export const DEFAULT_LIGHT_THEME = CLASSIC_LIGHT_THEME;

function choicesFrom(themes) {
    return Object.fromEntries(themes.map(({ key, labelKey }) => [key, labelKey]));
}

/**
 * Drops a stored key that no longer resolves against the palette list, so renaming
 * or retiring a palette in a later version degrades to the default instead of
 * leaving the sheet unstyled.
 */
function resolveTheme(themes, settingKey, fallback) {
    const stored = game.settings.get(MODULE_ID, settingKey);
    return themes.some(({ key }) => key === stored) ? stored : fallback;
}

export function applyTheme() {
    const root = document.documentElement;

    if (game.settings.get(MODULE_ID, "enable_dark_mode")) {
        delete root.dataset.masksLightTheme;
        root.dataset.masksDarkTheme = resolveTheme(DARK_THEMES, "dark_theme", DEFAULT_DARK_THEME);
        return;
    }

    delete root.dataset.masksDarkTheme;

    const light = resolveTheme(LIGHT_THEMES, "light_theme", DEFAULT_LIGHT_THEME);
    if (light === CLASSIC_LIGHT_THEME) delete root.dataset.masksLightTheme;
    else root.dataset.masksLightTheme = light;
}

export function initTheme() {
    game.settings.register(MODULE_ID, "enable_dark_mode", {
        name: "MASKS-SHEETS.Settings.enable_dark_mode.name",
        hint: "MASKS-SHEETS.Settings.enable_dark_mode.hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => applyTheme()
    });

    game.settings.register(MODULE_ID, "dark_theme", {
        name: "MASKS-SHEETS.Settings.dark_theme.name",
        hint: "MASKS-SHEETS.Settings.dark_theme.hint",
        scope: "client",
        config: true,
        type: String,
        choices: choicesFrom(DARK_THEMES),
        default: DEFAULT_DARK_THEME,
        onChange: () => applyTheme()
    });

    game.settings.register(MODULE_ID, "light_theme", {
        name: "MASKS-SHEETS.Settings.light_theme.name",
        hint: "MASKS-SHEETS.Settings.light_theme.hint",
        scope: "client",
        config: true,
        type: String,
        choices: choicesFrom(LIGHT_THEMES),
        default: DEFAULT_LIGHT_THEME,
        onChange: () => applyTheme()
    });

    applyTheme();
}
