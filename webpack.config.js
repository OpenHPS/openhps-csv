const PROJECT_NAME = "openhps-csv";
const LIBRARY_NAME = "@openhps/csv";

const path = require('path');

module.exports = env => [
  {
    name: PROJECT_NAME,
    mode: env.prod ? "production" : "development",
    entry: `./dist/cjs/index.web.js`,
    devtool: 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `web/${PROJECT_NAME}${env.prod ? ".min" : ""}.${env.module ? 'mjs' : 'js'}`,
      library: LIBRARY_NAME,
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: `(typeof self !== 'undefined' ? self : this)`,
    },
    externals: ['@openhps/core'],
    resolve: {
      alias: {
        typescript: false,
      },
      fallback: {
        path: false,
        fs: false,
        os: false,
        buffer: require.resolve("buffer/"),
        stream: require.resolve("stream-browserify")
      }
    },
    optimization: {
      minimize: env.prod,
      portableRecords: true,
      usedExports: true,
      providedExports: true
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  }
];
