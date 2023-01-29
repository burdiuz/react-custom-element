import { builtinModules } from "module";

import { readFileSync } from "fs";

import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

/**
 * Rollup config taken from rollup/plugins repo
 * https://github.com/rollup/plugins/blob/master/shared/rollup.config.mjs
 */

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default [
  {
    input: "src/index.ts",
    external: Object.keys(pkg.dependencies || {})
      .concat(Object.keys(pkg.peerDependencies || {}))
      .concat(builtinModules)
      .concat(["react-dom/client"]),
    onwarn: (warning) => {
      throw Object.assign(new Error(), warning);
    },
    strictDeprecations: true,
    output: [
      {
        format: "cjs",
        file: pkg.main,
        exports: "named",
        footer: "module.exports = Object.assign(exports.default, exports);",
        sourcemap: false,
      },
      {
        format: "es",
        file: pkg.module,
        plugins: [emitModulePackageFile()],
        sourcemap: false,
      },
    ],
    plugins: [
      resolve(),
      commonjs({}),
      typescript({
        include: "**/*.{ts,tsx}",
        module: "esnext",
        sourceMap: false,
      }),
    ],
  },
  {
    input: "./es/types/index.d.ts",
    output: [{ file: "index.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export function emitModulePackageFile() {
  return {
    name: "emit-module-package-file",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "package.json",
        source: `{
  "type":"module"
}
`,
      });
    },
  };
}
