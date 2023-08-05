const path = require('path');
const webpack = require('webpack');

module.exports = {
  dependencies: [
    'crypto',
  ],
  entry: [
    './src/js/merkleTree.js',
    './src/js/app.js',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'), // Set the output directory to 'dist'
    filename: 'bundle.js', // Output file name
  },
  plugins: [
    // Add the following plugin to define the Buffer object in the browser
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
