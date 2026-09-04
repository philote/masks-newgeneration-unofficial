import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "happy-dom",
		setupFiles: ["tests/setup.mjs"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["module/**/*.mjs"]
		}
	}
});
