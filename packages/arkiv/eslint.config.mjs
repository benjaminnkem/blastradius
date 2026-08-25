import { nodeConfig } from "@repo/eslint-config/node";

export default [
  ...nodeConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@nestjs/",
            "next",
            "react",
            "@blastradius/graph",
            "@blastradius/trust",
            "@blastradius/monitoring",
          ],
        },
      ],
    },
  },
];
