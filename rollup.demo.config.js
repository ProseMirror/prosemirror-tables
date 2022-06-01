import nodeResolve from "@rollup/plugin-node-resolve"
import commonJS from "@rollup/plugin-commonjs"

export default {
  input: "demo.js",
  output: {
    format: "iife",
    generatedCode: 'es2015',
    file: "demo_bundle.js"
  },
  plugins: [
    nodeResolve({
      main: true,
      browser: true
    }),

    commonJS({
      include: '../**',
      sourceMap: false
    })
  ]
}
