import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	CLASSIC_LIGHT_THEME,
	DARK_THEMES,
	DEFAULT_DARK_THEME,
	DEFAULT_LIGHT_THEME,
	LIGHT_THEMES,
	applyTheme,
	initTheme,
} from "../module/helpers/theme.mjs";

describe("theme", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		delete document.documentElement.dataset.masksDarkTheme;
		delete document.documentElement.dataset.masksLightTheme;
	});

	function stubGame({
		enabled = false,
		dark = DEFAULT_DARK_THEME,
		light = DEFAULT_LIGHT_THEME,
	} = {}) {
		vi.stubGlobal("game", {
			settings: {
				register: vi.fn(),
				get: vi.fn((_module, key) => {
					if (key === "enable_dark_mode") return enabled;
					return key === "dark_theme" ? dark : light;
				}),
			},
		});
	}

	function registeredSetting(key) {
		return game.settings.register.mock.calls.find((call) => call[1] === key)?.[2];
	}

	const { dataset } = document.documentElement;

	describe("initTheme", () => {
		it("registers every setting as client-scoped so each player controls their own theme", () => {
			stubGame();

			initTheme();

			for (const key of ["enable_dark_mode", "dark_theme", "light_theme"]) {
				expect(registeredSetting(key)).toMatchObject({ scope: "client" });
			}
		});

		it("offers every palette in each dropdown and defaults to a real one", () => {
			stubGame();

			initTheme();

			const cases = [
				["dark_theme", DARK_THEMES, DEFAULT_DARK_THEME],
				["light_theme", LIGHT_THEMES, DEFAULT_LIGHT_THEME],
			];

			for (const [key, themes, fallback] of cases) {
				const setting = registeredSetting(key);
				expect(Object.keys(setting.choices)).toEqual(themes.map((theme) => theme.key));
				expect(setting.default).toBe(fallback);
				expect(setting.choices).toHaveProperty(fallback);
			}
		});

		// Settings repaint via onChange rather than requiresReload, which is what lets a
		// player flip palettes without reloading the world.
		it("repaints on change instead of demanding a reload", () => {
			stubGame();

			initTheme();

			for (const key of ["enable_dark_mode", "dark_theme", "light_theme"]) {
				expect(registeredSetting(key).onChange).toBeTypeOf("function");
				expect(registeredSetting(key).requiresReload).toBeUndefined();
			}
		});

		it("applies the stored theme immediately on init", () => {
			stubGame({ enabled: true, dark: "teal" });

			initTheme();

			expect(dataset.masksDarkTheme).toBe("teal");
		});
	});

	describe("applyTheme", () => {
		it("marks the document with the chosen dark palette when dark mode is on", () => {
			stubGame({ enabled: true, dark: "graphite" });

			applyTheme();

			expect(dataset.masksDarkTheme).toBe("graphite");
			expect(dataset.masksLightTheme).toBeUndefined();
		});

		it("marks the document with the chosen light palette when dark mode is off", () => {
			stubGame({ enabled: false, light: "verdant" });

			applyTheme();

			expect(dataset.masksLightTheme).toBe("verdant");
			expect(dataset.masksDarkTheme).toBeUndefined();
		});

		// Classic light is the bare :root block in masks-sheets.scss rather than a palette
		// block of its own, so it must leave the attribute off entirely.
		it("sets no light attribute for the classic palette", () => {
			stubGame({ enabled: false, light: CLASSIC_LIGHT_THEME });

			applyTheme();

			expect(dataset.masksLightTheme).toBeUndefined();
			expect(dataset.masksDarkTheme).toBeUndefined();
		});

		it("clears the other mode's attribute when toggling", () => {
			dataset.masksLightTheme = "ink";
			stubGame({ enabled: true, dark: "navy" });

			applyTheme();

			expect(dataset.masksDarkTheme).toBe("navy");
			expect(dataset.masksLightTheme).toBeUndefined();
		});

		// A palette renamed or retired in a later version must degrade to the default
		// rather than leaving the sheet with no palette applied at all.
		it("falls back to the default when a stored palette no longer exists", () => {
			stubGame({ enabled: true, dark: "chartreuse" });
			applyTheme();
			expect(dataset.masksDarkTheme).toBe(DEFAULT_DARK_THEME);

			stubGame({ enabled: false, light: "chartreuse" });
			applyTheme();
			expect(dataset.masksLightTheme).toBeUndefined();
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
	});
});
