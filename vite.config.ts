import { defineConfig } from "vite";
import * as path from "path";
import dts from "vite-plugin-dts";
import tsConfigPaths from "vite-tsconfig-paths";
import * as packageJson from "./package.json";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

const libConfig = defineConfig({
  plugins: [
    dts({
      outputDir: "dist",
    }),
    tsConfigPaths(),
    getBabelOutputPlugin({
      presets: ["@babel/preset-env"],
    }),
  ],
  build: {
    minify: true,
    target: ["safari11"],
    lib: {
      entry: {
        index: path.resolve("src", "index.ts"),
      },
      name: "noticeX",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
    },
  },
});

export default libConfig;
