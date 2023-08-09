const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  output: {
    library: 'TigCore',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    filename: 'index.js',
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
  },
  optimization: {
    minimize: true,
  },
};
