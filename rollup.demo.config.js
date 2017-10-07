import buble from "rollup-plugin-buble"
import nodeResolve from "rollup-plugin-node-resolve"
import commonJS from "rollup-plugin-commonjs"

export default {
  entry: "demo.js",
  dest: "demo_bundle.js",
  format: "iife",
  plugins: [
    buble({
      exclude: "node_modules/**",
      namedFunctionExpressions: false
    }),

    nodeResolve({
      main: true,
      browser: true
    }),

    commonJS({
      include: '**',
      sourceMap: false
    })
  ]
}
