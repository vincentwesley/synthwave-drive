import { defineConfig } from "vitest/config";

export default defineConfig({ base: "/synthwave-drive/", test: { include: ["tests/unit/**/*.test.ts"] } });
