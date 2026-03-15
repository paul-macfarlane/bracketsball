import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    // Next.js App Router conventions
    "app/**/page.tsx",
    "app/**/layout.tsx",
    "app/**/actions.ts",
    "app/**/route.ts",
    "app/globals.css",
    // Scripts
    "scripts/**/*.ts",
    // Tests
    "**/*.test.ts",
  ],
  project: ["**/*.{ts,tsx}"],
  ignore: [
    // ShadCN UI components are managed by CLI
    "components/ui/**",
  ],
  ignoreDependencies: [
    // Transitive dependency via Next.js, used in postcss.config.mjs
    "postcss",
  ],
};

export default config;
