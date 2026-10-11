import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CLASSIC_LIGHT_THEME,
	DARK_THEMES,
	DEFAULT_DARK_THEME,
	LIGHT_THEMES,
	THEMES,
	applyTheme,
	initTheme,
} from "../module/helpers/theme.mjs";

const LEGACY_KEYS = ["enable_dark_mode", "dark_theme", "light_theme"];

describe("theme", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		delete document.documentElement.dataset.masksDarkTheme;
		delete document.documentElement.dataset.masksLightTheme;
	});

	// Mimics Foundry: an unstored setting reads back as its registered default.
	function stubGame(stored = {}) {
		const registered = {};
		vi.stubGlobal("game", {
			settings: {
				register: vi.fn((_module, key, config) => {
					registered[key] = config;
				}),
				get: vi.fn((_module, key) => (key in stored ? stored[key] : registered[key]?.default)),
			},
		});
	}

	function registeredSetting(key) {
		return game.settings.register.mock.calls.find((call) => call[1] === key)?.[2];
	}

	const { dataset } = document.documentElement;

	describe("initTheme", () => {
		it("registers one client-scoped theme dropdown that repaints without a reload", () => {
			stubGame();

			initTheme();

			const setting = registeredSetting("theme");
			expect(setting).toMatchObject({ scope: "client", config: true });
			expect(setting.onChange).toBeTypeOf("function");
			expect(setting.requiresReload).toBeUndefined();
		});

		it("keeps the legacy settings registered but hidden from the settings menu", () => {
			stubGame();

			initTheme();

			for (const key of LEGACY_KEYS) {
				expect(registeredSetting(key)).toMatchObject({ scope: "client", config: false });
			}
		});

		it("offers every light palette, then every dark palette", () => {
			stubGame();

			initTheme();

			expect(Object.keys(registeredSetting("theme").choices)).toEqual([
				...LIGHT_THEMES.map((theme) => theme.key),
				...DARK_THEMES.map((theme) => theme.key),
			]);
		});

		it("applies the stored theme immediately on init", () => {
			stubGame({ theme: "teal" });

			initTheme();

			expect(dataset.masksDarkTheme).toBe("teal");
		});
	});

	// Players who picked a palette under the old checkbox + two dropdowns must keep it.
	describe("migration from the legacy settings", () => {
		function defaultFor(stored) {
			stubGame(stored);
			initTheme();
			return registeredSetting("theme").default;
		}

		it("carries over a dark palette when legacy dark mode was on", () => {
			expect(defaultFor({ enable_dark_mode: true, dark_theme: "teal", light_theme: "ink" })).toBe("teal");
			expect(dataset.masksDarkTheme).toBe("teal");
		});

		it("carries over a light palette when legacy dark mode was off", () => {
			expect(defaultFor({ enable_dark_mode: false, dark_theme: "teal", light_theme: "verdant" })).toBe("verdant");
			expect(dataset.masksLightTheme).toBe("verdant");
		});

		it("defaults a player who never touched any setting to classic", () => {
			expect(defaultFor({})).toBe(CLASSIC_LIGHT_THEME);
		});

		it("uses the old dark default when legacy dark mode was on with no palette picked", () => {
			expect(defaultFor({ enable_dark_mode: true })).toBe(DEFAULT_DARK_THEME);
		});

		it("falls back within the legacy mode when the legacy palette no longer exists", () => {
			expect(defaultFor({ enable_dark_mode: true, dark_theme: "chartreuse" })).toBe(DEFAULT_DARK_THEME);
			expect(defaultFor({ enable_dark_mode: false, light_theme: "chartreuse" })).toBe(CLASSIC_LIGHT_THEME);
		});

		it("lets an explicit pick from the new dropdown win over the legacy settings", () => {
			stubGame({ enable_dark_mode: true, dark_theme: "teal", theme: "dusk" });

			initTheme();

			expect(dataset.masksLightTheme).toBe("dusk");
			expect(dataset.masksDarkTheme).toBeUndefined();
		});
	});

	describe("applyTheme", () => {
		it("marks the document with a dark palette when one is chosen", () => {
			stubGame({ theme: "graphite" });

			applyTheme();

			expect(dataset.masksDarkTheme).toBe("graphite");
			expect(dataset.masksLightTheme).toBeUndefined();
		});

		it("marks the document with a light palette when one is chosen", () => {
			stubGame({ theme: "verdant" });

			applyTheme();

			expect(dataset.masksLightTheme).toBe("verdant");
			expect(dataset.masksDarkTheme).toBeUndefined();
		});

		// Classic light is the bare :root block in masks-sheets.scss rather than a palette
		// block of its own, so it must leave the attribute off entirely.
		it("sets no attribute for the classic palette", () => {
			stubGame({ theme: CLASSIC_LIGHT_THEME });

			applyTheme();

			expect(dataset.masksLightTheme).toBeUndefined();
			expect(dataset.masksDarkTheme).toBeUndefined();
		});

		it("clears the other mode's attribute when switching", () => {
			dataset.masksLightTheme = "ink";
			stubGame({ theme: "navy" });
			applyTheme();
			expect(dataset.masksDarkTheme).toBe("navy");
			expect(dataset.masksLightTheme).toBeUndefined();

			stubGame({ theme: "dusk" });
			applyTheme();
			expect(dataset.masksLightTheme).toBe("dusk");
			expect(dataset.masksDarkTheme).toBeUndefined();
		});

		// A palette renamed or retired in a later version must degrade to the default
		// rather than leaving a stale or unknown palette attribute behind.
		it("falls back to classic when the stored palette no longer exists", () => {
			stubGame({ theme: "chartreuse" });

			applyTheme();

			expect(dataset.masksLightTheme).toBeUndefined();
			expect(dataset.masksDarkTheme).toBeUndefined();
		});
	});

	describe("translations", () => {
		function readChoices(lang) {
			const json = JSON.parse(readFileSync(resolve(process.cwd(), "languages", `${lang}.json`), "utf8"));
			return json["MASKS-SHEETS"].Settings.theme.choices;
		}

		it("labels every palette in every language", () => {
			for (const lang of ["en", "es", "fr"]) {
				const choices = readChoices(lang);
				for (const { key } of THEMES) expect(choices[key], `${lang}: ${key}`).toBeTruthy();
			}
		});

		it("marks exactly the dark palettes as dark in English", () => {
			const choices = readChoices("en");

			for (const { key } of DARK_THEMES) expect(choices[key]).toMatch(/dark\)$/);
			for (const { key } of LIGHT_THEMES) expect(choices[key]).not.toMatch(/dark/i);
		});
	});

	// Guards against a palette list gaining an entry that the SCSS never got, and
	// against the compiled CSS not being rebuilt after a SCSS edit - neither of which
	// fails anywhere else, since the compiled CSS is a committed artifact.
	describe("compiled CSS", () => {
		// import.meta.url is not a file: URL under the happy-dom environment.
		function readCss(name) {
			return readFileSync(resolve(process.cwd(), "css", name), "utf8");
		}

		it("has a block for every dark palette", () => {
			const css = readCss("dark-mode.css");

			for (const { key } of DARK_THEMES) {
				expect(css).toMatch(
					new RegExp(`:root\\[data-masks-dark-theme=["']?${key}["']?\\]`)
				);
			}
		});

		it("has a block for every light palette except classic", () => {
			const css = readCss("light-mode.css");

			for (const { key } of LIGHT_THEMES) {
				const pattern = new RegExp(`:root\\[data-masks-light-theme=["']?${key}["']?\\]`);
				if (key === CLASSIC_LIGHT_THEME) expect(css).not.toMatch(pattern);
				else expect(css).toMatch(pattern);
			}
		});

		function paletteBlock(css, mode, key) {
			return css.match(new RegExp(`:root\\[data-masks-${mode}-theme=["']?${key}["']?\\]\\s*\\{([^}]*)\\}`))?.[1];
		}

		// Without its own pair, a palette silently falls back to classic's yellow accent.
		it("gives every non-classic palette its own accent and accent text color", () => {
			const palettes = [
				...DARK_THEMES.map(({ key }) => ["dark", key]),
				...LIGHT_THEMES.filter(({ key }) => key !== CLASSIC_LIGHT_THEME).map(({ key }) => ["light", key]),
			];

			for (const [mode, key] of palettes) {
				const block = paletteBlock(readCss(`${mode}-mode.css`), mode, key);
				expect(block, key).toMatch(/--masks-accent-color:/);
				expect(block, key).toMatch(/--masks-accent-text-color:/);
			}
		});

		it("gives each dark palette input outlines in its own accent", () => {
			const css = readCss("dark-mode.css");

			for (const { key } of DARK_THEMES) {
				const block = paletteBlock(css, "dark", key);
				const accent = block.match(/--masks-accent-color:\s*([^;]+);/)[1];
				expect(block, key).toContain(`--masks-input-border-color: ${accent};`);
			}
		});

		it("keeps the old amber only as the partial-hit result color in dark mode", () => {
			const lines = readCss("dark-mode.css").split("\n").filter((line) => /#cd8e18/i.test(line));

			expect(lines.map((line) => line.trim())).toEqual(["--masks-result-partial-color: #cd8e18;"]);
		});

		it("draws the classic accent from the renamed variables only", () => {
			const css = readCss("masks-sheets.css");

			expect(css).not.toMatch(/--masks-tab-bg-active-color|--masks-tabs-border-color/);
			expect(css).toMatch(/--masks-accent-color:\s*#ffeb98/);
		});
	});
});
