import { afterEach, describe, expect, it, vi } from "vitest";
import { initDarkMode } from "../module/helpers/dark-mode.mjs";

describe("initDarkMode", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	function stubGame(enabled) {
		vi.stubGlobal("game", {
			settings: {
				register: vi.fn(),
				get: vi.fn(() => enabled),
			},
		});
		vi.stubGlobal("foundry", {
			utils: {
				getRoute: (path) => `/game/${path}`,
			},
		});
	}

	// Stubs document.getElementsByTagName('HEAD') with a fake node instead of letting
	// initDarkMode append a real <link> to the live document: happy-dom eagerly fetches
	// a real stylesheet <link> the moment it's appended, which is unreachable in tests.
	function stubHead() {
		const head = { appendChild: vi.fn() };
		vi.spyOn(document, "getElementsByTagName").mockReturnValue([head]);
		return head;
	}

	it("registers the setting as client-scoped so each player controls their own theme", () => {
		stubGame(false);
		stubHead();

		initDarkMode();

		expect(game.settings.register).toHaveBeenCalledWith(
			"masks-newgeneration-unofficial",
			"enable_dark_mode",
			expect.objectContaining({ scope: "client" })
		);
	});

	it("injects the dark-mode stylesheet when enabled", () => {
		stubGame(true);
		const head = stubHead();

		initDarkMode();

		expect(head.appendChild).toHaveBeenCalledTimes(1);
		const link = head.appendChild.mock.calls[0][0];
		expect(link.rel).toBe("stylesheet");
		expect(link.href).toContain("modules/masks-newgeneration-unofficial/css/dark-mode.css");
	});

	it("does not inject the stylesheet when disabled", () => {
		stubGame(false);
		const head = stubHead();

		initDarkMode();

		expect(head.appendChild).not.toHaveBeenCalled();
	});
});
