import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "scripts/", "check_images.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "src/**/*.{ts,tsx}",
      "data/**/*.ts",
      "vite.config.ts",
      "vitest.config.ts",
    ],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // The classic hook rules only — v7's React-Compiler-derived rules
      // (set-state-in-effect, immutability, …) flag several intentional,
      // working patterns in this codebase (reset-on-prop-change effects,
      // window.location.hash assignment).
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // try/catch around localStorage uses intentionally-empty catch blocks.
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
