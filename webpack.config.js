
var webpack = require('webpack');
var path = require('path');


function config(minify) {
  return {
    devtool: !minify ? "inline-sourcemap" : null,
    module:
    {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules)/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015'],
            plugins: [ ['babel-plugin-transform-builtin-extend', {globals: ["Error", "Array"]}] ]
          }
        }
      ]
    },
    output: {
      filename: minify ? "d3graphs.min.js" : "d3graphs.js"
    },
    plugins: !minify ? [] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({mangle: false, sourcemap: false}),
    ]
  };
}

module.exports = config(false);

module.exports.config = config;