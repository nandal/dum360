import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/database/schema/*.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ??
			"postgres://dum360:dum360@localhost:5432/dum360",
	},
});
