import { nodeConfig } from "@repo/eslint-config/node";

export default [
  ...nodeConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@blastradius/arkiv",
            "@blastradius/observability",
            "@nestjs/",
            "next",
            "react",
            "@arkiv-network/sdk",
          ],
        },
      ],
    },
  },
];
