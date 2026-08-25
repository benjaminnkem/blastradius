#!/usr/bin/env python3
"""One-shot Phase 0 file writer. Not a runtime product tool."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(rel: str, content: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


PACKAGES = [
    "schemas",
    "config",
    "arkiv",
    "graph",
    "trust",
    "monitoring",
    "observability",
    "shared",
]

PACKAGE_DEPS = {
    "schemas": {},
    "config": {"zod": "4.4.3"},
    "arkiv": {"@arkiv-network/sdk": "0.7.0", "viem": "2.55.19"},
    "graph": {},
    "trust": {},
    "monitoring": {},
    "observability": {"pino": "10.3.1"},
    "shared": {},
}

RESTRICTED = {
    "schemas": ["@blastradius/arkiv", "@blastradius/graph", "@blastradius/trust", "@blastradius/monitoring", "@blastradius/observability", "@blastradius/config", "@nestjs/", "next", "react"],
    "config": ["@blastradius/arkiv", "@blastradius/graph", "@blastradius/trust", "@blastradius/monitoring", "@blastradius/observability", "@nestjs/", "next", "react"],
    "shared": ["@blastradius/arkiv", "@blastradius/graph", "@blastradius/trust", "@blastradius/monitoring", "@blastradius/observability", "@blastradius/config", "@blastradius/schemas", "@nestjs/", "next", "react"],
    "graph": ["@blastradius/arkiv", "@blastradius/observability", "@nestjs/", "next", "react", "@arkiv-network/sdk"],
    "trust": ["@blastradius/arkiv", "@blastradius/observability", "@nestjs/", "next", "react", "@arkiv-network/sdk"],
    "monitoring": ["@blastradius/arkiv", "@blastradius/graph", "@blastradius/trust", "@nestjs/", "next", "react", "@arkiv-network/sdk"],
    "observability": ["@blastradius/arkiv", "@blastradius/graph", "@blastradius/trust", "@blastradius/monitoring", "@nestjs/", "next", "react", "@arkiv-network/sdk"],
    "arkiv": ["@nestjs/", "next", "react", "@blastradius/graph", "@blastradius/trust", "@blastradius/monitoring"],
}

TSCONFIG = """{
  "extends": "@repo/typescript-config/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "noEmit": true
  },
  "include": ["src", "vitest.config.ts"]
}
"""

VITEST = """import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
"""


def package_json(name: str) -> str:
    deps = PACKAGE_DEPS[name]
    dep_block = ""
    if deps:
        entries = ",\n".join(f'    "{k}": "{v}"' for k, v in deps.items())
        dep_block = f',\n  "dependencies": {{\n{entries}\n  }}'
    return f"""{{
  "name": "@blastradius/{name}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {{
    ".": "./src/index.ts"
  }},
  "scripts": {{
    "build": "tsc --noEmit",
    "check-types": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run"
  }}{dep_block},
  "devDependencies": {{
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "26.3.0",
    "eslint": "10.9.1",
    "typescript": "7.0.2",
    "vitest": "4.1.11"
  }}
}}
"""


def eslint_config(name: str) -> str:
    patterns = RESTRICTED[name]
    quoted = ", ".join(f'"{p}"' for p in patterns)
    return f"""import {{ nodeConfig }} from "@repo/eslint-config/node";

export default [
  ...nodeConfig,
  {{
    rules: {{
      "no-restricted-imports": [
        "error",
        {{
          patterns: [{quoted}],
        }},
      ],
    }},
  }},
];
"""


IDENTITY_INDEX = {
    "schemas": '''export const PACKAGE_NAME = "@blastradius/schemas" as const;
export const IMPLEMENTATION_PHASE = 0 as const;
''',
    "graph": '''export const PACKAGE_NAME = "@blastradius/graph" as const;
export const IMPLEMENTATION_PHASE = 0 as const;
''',
    "trust": '''export const PACKAGE_NAME = "@blastradius/trust" as const;
export const IMPLEMENTATION_PHASE = 0 as const;
''',
    "monitoring": '''export const PACKAGE_NAME = "@blastradius/monitoring" as const;
export const IMPLEMENTATION_PHASE = 0 as const;
''',
}


def identity_test(name: str) -> str:
    return f"""import {{ describe, expect, it }} from "vitest";
import {{ IMPLEMENTATION_PHASE, PACKAGE_NAME }} from "./index";

describe("@blastradius/{name}", () => {{
  it("is a phase 0 identity export only", () => {{
    expect(PACKAGE_NAME).toBe("@blastradius/{name}");
    expect(IMPLEMENTATION_PHASE).toBe(0);
  }});
}});
"""


for name in PACKAGES:
    write(f"packages/{name}/package.json", package_json(name))
    write(f"packages/{name}/tsconfig.json", TSCONFIG)
    write(f"packages/{name}/vitest.config.ts", VITEST)
    write(f"packages/{name}/eslint.config.mjs", eslint_config(name))
    if name in IDENTITY_INDEX:
        write(f"packages/{name}/src/index.ts", IDENTITY_INDEX[name])
        write(f"packages/{name}/src/index.test.ts", identity_test(name))

print("package scaffolds written")
