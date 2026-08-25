import { nodeConfig } from "@repo/eslint-config/node";

export default [
  ...nodeConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@arkiv-network/sdk", "next", "react"],
        },
      ],
    },
  },
];
