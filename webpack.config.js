const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  output: {
    library: 'TigCore',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    filename: 'tig-core.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [{
      test: /\.tsx?$/, use: 'ts-loader', // TypeScript加载器
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@lib': path.resolve(__dirname, './src/lib'),
      '@core': path.resolve(__dirname, './src/core'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  optimization: {
    minimize: true,
  },
};
