import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initLoginBackground, promptLoginBackgroundOnce } from "../module/helpers/login-background.mjs";

const MODULE_ID = "masks-newgeneration-unofficial";
const LOGIN_BACKGROUND = `modules/${MODULE_ID}/images/login-bg-lt.webp`;

describe("login background", () => {
	let confirm;
	let fetchJsonWithTimeout;
	let notifyError;
	let updateSource;

	function stubGame({ firstTime = true } = {}) {
		vi.stubGlobal("game", {
			settings: {
				register: vi.fn(),
				get: vi.fn(() => firstTime),
				set: vi.fn().mockResolvedValue(undefined),
			},
			world: { id: "halcyon-city", updateSource },
		});
	}

	/** The options object the module handed DialogV2.confirm. */
	function dialogOptions() {
		return confirm.mock.calls[0]?.[0];
	}

	beforeEach(() => {
		confirm = vi.fn().mockResolvedValue(true);
		fetchJsonWithTimeout = vi.fn().mockResolvedValue({ id: "halcyon-city", background: LOGIN_BACKGROUND });
		notifyError = vi.fn();
		updateSource = vi.fn();

		vi.stubGlobal("foundry", {
			applications: {
				api: { DialogV2: { confirm } },
				handlebars: { loadTemplates: vi.fn().mockResolvedValue([]) },
			},
			utils: {
				fetchJsonWithTimeout,
				getRoute: vi.fn((route) => `/${route}`),
			},
		});
		vi.stubGlobal("ui", { notifications: { error: notifyError } });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	describe("initLoginBackground", () => {
		it("registers firstTime as a hidden world flag that starts armed", () => {
			stubGame();

			initLoginBackground();

			expect(game.settings.register).toHaveBeenCalledWith(MODULE_ID, "firstTime", expect.objectContaining({
				scope: "world",
				config: false,
				type: Boolean,
				default: true,
			}));
		});
	});

	describe("promptLoginBackgroundOnce", () => {
		it("asks nothing once the flag has been cleared", async () => {
			stubGame({ firstTime: false });

			await promptLoginBackgroundOnce();

			expect(confirm).not.toHaveBeenCalled();
			expect(fetchJsonWithTimeout).not.toHaveBeenCalled();
		});

		it("clears the flag before showing the dialog, so a dismissed dialog never re-asks", async () => {
			stubGame();

			await promptLoginBackgroundOnce();

			expect(game.settings.set).toHaveBeenCalledWith(MODULE_ID, "firstTime", false);
			expect(confirm).toHaveBeenCalledTimes(1);
		});

		// Regression guard for issue #9: the "yes" callback used to re-arm firstTime,
		// which re-asked the question on every world load forever.
		it("never re-arms the flag, even after the player accepts", async () => {
			stubGame();

			await promptLoginBackgroundOnce();
			await dialogOptions().yes.callback();

			const reArmed = game.settings.set.mock.calls.some(
				([, key, value]) => key === "firstTime" && value === true
			);
			expect(reArmed).toBe(false);
		});

		it("applies the Masks art to the world when the player accepts", async () => {
			stubGame();

			await promptLoginBackgroundOnce();
			await dialogOptions().yes.callback();

			const [route, request] = fetchJsonWithTimeout.mock.calls[0];
			expect(route).toBe("/setup");
			expect(request.method).toBe("POST");
			expect(JSON.parse(request.body)).toEqual({
				id: "halcyon-city",
				action: "editWorld",
				background: LOGIN_BACKGROUND,
			});
			expect(updateSource).toHaveBeenCalledWith({ id: "halcyon-city", background: LOGIN_BACKGROUND });
		});

		it("surfaces a rejected edit instead of updating the world", async () => {
			stubGame();
			fetchJsonWithTimeout.mockResolvedValue({ error: "You lack permission." });

			await promptLoginBackgroundOnce();
			await dialogOptions().yes.callback();

			expect(notifyError).toHaveBeenCalledWith("You lack permission.");
			expect(updateSource).not.toHaveBeenCalled();
		});

		it("surfaces a failed request instead of throwing", async () => {
			stubGame();
			const failure = new Error("Request timed out");
			fetchJsonWithTimeout.mockRejectedValue(failure);

			await promptLoginBackgroundOnce();
			await expect(dialogOptions().yes.callback()).resolves.toBeUndefined();

			expect(notifyError).toHaveBeenCalledWith(failure);
			expect(updateSource).not.toHaveBeenCalled();
		});
	});
});
