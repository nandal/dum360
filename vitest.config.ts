import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: [
			"packages/*/test/**/*.test.ts",
			"services/*/test/**/*.test.ts",
			"test/**/*.test.ts",
		],
		setupFiles: ["./test/setup.ts"],
		testTimeout: 15000,
		server: {
			deps: {
				inline: ["@dum360/shared"],
			},
		},
	},
	resolve: {
		conditions: ["development", "import"],
	},
});
