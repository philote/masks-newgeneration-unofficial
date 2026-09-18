import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	DARK_THEMES,
	DEFAULT_DARK_THEME,
	applyDarkTheme,
	initDarkMode,
} from "../module/helpers/dark-mode.mjs";

describe("dark mode", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		delete document.documentElement.dataset.masksDarkTheme;
	});

	function stubGame({ enabled = false, theme = DEFAULT_DARK_THEME } = {}) {
		vi.stubGlobal("game", {
			settings: {
				register: vi.fn(),
				get: vi.fn((_module, key) =>
					key === "enable_dark_mode" ? enabled : theme
				),
			},
		});
	}

	function registeredSetting(key) {
		return game.settings.register.mock.calls.find((call) => call[1] === key)?.[2];
	}

	describe("initDarkMode", () => {
		it("registers both settings as client-scoped so each player controls their own theme", () => {
			stubGame();

			initDarkMode();

			expect(registeredSetting("enable_dark_mode")).toMatchObject({ scope: "client" });
			expect(registeredSetting("dark_theme")).toMatchObject({ scope: "client" });
		});

		it("offers every palette in the dropdown and defaults to a real one", () => {
			stubGame();

			initDarkMode();

			const setting = registeredSetting("dark_theme");
			expect(Object.keys(setting.choices)).toEqual(DARK_THEMES.map(({ key }) => key));
			expect(setting.default).toBe(DEFAULT_DARK_THEME);
			expect(setting.choices).toHaveProperty(DEFAULT_DARK_THEME);
		});

		// Both settings repaint via onChange rather than requiresReload, which is what
		// lets a player flip palettes without reloading the world.
		it("repaints on change instead of demanding a reload", () => {
			stubGame();

			initDarkMode();

			for (const key of ["enable_dark_mode", "dark_theme"]) {
				expect(registeredSetting(key).onChange).toBeTypeOf("function");
				expect(registeredSetting(key).requiresReload).toBeUndefined();
			}
		});

		it("applies the stored theme immediately on init", () => {
			stubGame({ enabled: true, theme: "teal" });

			initDarkMode();

			expect(document.documentElement.dataset.masksDarkTheme).toBe("teal");
		});
	});

	describe("applyDarkTheme", () => {
		it("marks the document with the chosen palette when enabled", () => {
			stubGame({ enabled: true, theme: "graphite" });

			applyDarkTheme();

			expect(document.documentElement.dataset.masksDarkTheme).toBe("graphite");
		});

		it("removes the marker when disabled", () => {
			document.documentElement.dataset.masksDarkTheme = "teal";
			stubGame({ enabled: false });

			applyDarkTheme();

			expect(document.documentElement.dataset.masksDarkTheme).toBeUndefined();
		});

		// A palette renamed or retired in a later version must degrade to the default
		// rather than leaving the sheet with no dark palette applied at all.
		it("falls back to the default when the stored palette no longer exists", () => {
			stubGame({ enabled: true, theme: "chartreuse" });

			applyDarkTheme();

			expect(document.documentElement.dataset.masksDarkTheme).toBe(DEFAULT_DARK_THEME);
		});
	});

	// Guards against DARK_THEMES gaining a palette that src/scss/dark-mode.scss never
	// got, and against css/dark-mode.css not being rebuilt after a SCSS edit - neither
	// of which fails anywhere else, since the compiled CSS is a committed artifact.
	it("has a compiled CSS block for every palette", () => {
		// import.meta.url is not a file: URL under the happy-dom environment.
		const css = readFileSync(resolve(process.cwd(), "css/dark-mode.css"), "utf8");

		for (const { key } of DARK_THEMES) {
			expect(css).toMatch(
				new RegExp(`:root\\[data-masks-dark-theme=["']?${key}["']?\\]`)
			);
		}
	});
});
