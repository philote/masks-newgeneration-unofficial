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

function themeChoices() {
    return Object.fromEntries(DARK_THEMES.map(({ key, labelKey }) => [key, labelKey]));
}

/**
 * Drops a stored key that no longer resolves against DARK_THEMES, so renaming or
 * retiring a palette in a later version degrades to the default instead of leaving
 * the sheet unstyled.
 */
export function applyDarkTheme() {
    const root = document.documentElement;

    if (!game.settings.get(MODULE_ID, "enable_dark_mode")) {
        delete root.dataset.masksDarkTheme;
        return;
    }

    const stored = game.settings.get(MODULE_ID, "dark_theme");
    const resolved = DARK_THEMES.some(({ key }) => key === stored) ? stored : DEFAULT_DARK_THEME;
    root.dataset.masksDarkTheme = resolved;
}

export function initDarkMode() {
    game.settings.register(MODULE_ID, "enable_dark_mode", {
        name: "MASKS-SHEETS.Settings.enable_dark_mode.name",
        hint: "MASKS-SHEETS.Settings.enable_dark_mode.hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => applyDarkTheme()
    });

    game.settings.register(MODULE_ID, "dark_theme", {
        name: "MASKS-SHEETS.Settings.dark_theme.name",
        hint: "MASKS-SHEETS.Settings.dark_theme.hint",
        scope: "client",
        config: true,
        type: String,
        choices: themeChoices(),
        default: DEFAULT_DARK_THEME,
        onChange: () => applyDarkTheme()
    });

    applyDarkTheme();
}
