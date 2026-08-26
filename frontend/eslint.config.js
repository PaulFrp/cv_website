import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
	{ ignores: ["dist/**"] },

	js.configs.recommended,

	{
		files: ["src/**/*.{js,jsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.browser,
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		settings: { react: { version: "detect" } },
		plugins: { react, "react-hooks": reactHooks },
		rules: {
			...react.configs.flat.recommended.rules,
			...react.configs.flat["jsx-runtime"].rules,
			...reactHooks.configs.recommended.rules,
			// Data is static and internal, so prop shapes are documented in code
			// rather than duplicated as runtime prop types.
			"react/prop-types": "off",
			"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		},
	},

	{
		files: ["vite.config.js", "vite/**/*.js", "eslint.config.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.node,
		},
	},
];
