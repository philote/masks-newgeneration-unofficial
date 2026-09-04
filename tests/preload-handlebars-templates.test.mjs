import { describe, expect, it } from "vitest";
import { preloadHandlebarsTemplates } from "../module/helpers/utils.mjs";

describe("preloadHandlebarsTemplates", () => {
	it("loads the actor sheet templates via foundry.applications.handlebars.loadTemplates", async () => {
		await preloadHandlebarsTemplates();

		expect(foundry.applications.handlebars.loadTemplates).toHaveBeenCalledWith(
			expect.arrayContaining([
				"modules/masks-newgeneration-unofficial/templates/sheets/actor-sheet.hbs"
			])
		);
	});
});
