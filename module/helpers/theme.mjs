const MODULE_ID = "masks-newgeneration-unofficial";

/**
 * Palette keys must match the $masks-dark-themes map in src/scss/dark-mode.scss,
 * and must never collide with a LIGHT_THEMES key — the single theme setting tells
 * the two modes apart purely by which list a key belongs to.
 */
export const DARK_THEMES = [
    { key: "indigo", labelKey: "MASKS-SHEETS.Settings.theme.choices.indigo" },
    { key: "teal", labelKey: "MASKS-SHEETS.Settings.theme.choices.teal" },
    { key: "navy", labelKey: "MASKS-SHEETS.Settings.theme.choices.navy" },
    { key: "graphite", labelKey: "MASKS-SHEETS.Settings.theme.choices.graphite" },
    { key: "auburn", labelKey: "MASKS-SHEETS.Settings.theme.choices.auburn" }
];

export const DEFAULT_DARK_THEME = "indigo";

/**
 * Palette keys must match the $masks-light-themes map in src/scss/light-mode.scss —
 * except CLASSIC_LIGHT_THEME, which has no block there because it is the bare :root
 * default in masks-sheets.scss.
 */
export const LIGHT_THEMES = [
    { key: "classic", labelKey: "MASKS-SHEETS.Settings.theme.choices.classic" },
    { key: "dusk", labelKey: "MASKS-SHEETS.Settings.theme.choices.dusk" },
    { key: "verdant", labelKey: "MASKS-SHEETS.Settings.theme.choices.verdant" },
    { key: "overcast", labelKey: "MASKS-SHEETS.Settings.theme.choices.overcast" },
    { key: "ink", labelKey: "MASKS-SHEETS.Settings.theme.choices.ink" }
];

export const CLASSIC_LIGHT_THEME = "classic";
export const DEFAULT_LIGHT_THEME = CLASSIC_LIGHT_THEME;

export const THEMES = [...LIGHT_THEMES, ...DARK_THEMES];

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

function legacyTheme() {
    if (game.settings.get(MODULE_ID, "enable_dark_mode")) {
        return resolveTheme(DARK_THEMES, "dark_theme", DEFAULT_DARK_THEME);
    }
    return resolveTheme(LIGHT_THEMES, "light_theme", DEFAULT_LIGHT_THEME);
}

export function applyTheme() {
    const root = document.documentElement;
    const theme = resolveTheme(THEMES, "theme", DEFAULT_LIGHT_THEME);

    if (DARK_THEMES.some(({ key }) => key === theme)) {
        delete root.dataset.masksLightTheme;
        root.dataset.masksDarkTheme = theme;
        return;
    }

    delete root.dataset.masksDarkTheme;

    if (theme === CLASSIC_LIGHT_THEME) delete root.dataset.masksLightTheme;
    else root.dataset.masksLightTheme = theme;
}

export function initTheme() {
    // Legacy settings (checkbox + two dropdowns), hidden and kept only to seed `theme`'s default — drop them only after a real write-once migration.
    game.settings.register(MODULE_ID, "enable_dark_mode", {
        scope: "client",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(MODULE_ID, "dark_theme", {
        scope: "client",
        config: false,
        type: String,
        default: DEFAULT_DARK_THEME
    });

    game.settings.register(MODULE_ID, "light_theme", {
        scope: "client",
        config: false,
        type: String,
        default: DEFAULT_LIGHT_THEME
    });

    game.settings.register(MODULE_ID, "theme", {
        name: "MASKS-SHEETS.Settings.theme.name",
        hint: "MASKS-SHEETS.Settings.theme.hint",
        scope: "client",
        config: true,
        type: String,
        choices: choicesFrom(THEMES),
        default: legacyTheme(),
        onChange: () => applyTheme()
    });

    applyTheme();
}
