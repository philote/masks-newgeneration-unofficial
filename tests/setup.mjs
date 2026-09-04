import { vi } from "vitest";

// Minimal stand-ins for the Foundry VTT globals that module code touches.
// Extend these as real tests start exercising more of the Foundry API.
vi.stubGlobal("foundry", {
	applications: {
		handlebars: {
			loadTemplates: vi.fn().mockResolvedValue([])
		}
	}
});
