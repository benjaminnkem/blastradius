import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * Shared ESLint configuration for Node.js packages and NestJS apps.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nodeConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ["coverage/**", "vitest.config.ts"],
  },
];
