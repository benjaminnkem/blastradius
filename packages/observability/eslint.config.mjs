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
            "@blastradius/graph",
            "@blastradius/trust",
            "@blastradius/monitoring",
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
