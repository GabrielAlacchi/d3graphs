
var webpack = require('webpack');
var path = require('path');

module.exports = function(minify) {
  
  return {
    devtool: !minify ? "inline-sourcemap" : null,
      module
  :
    {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules)/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015']
          }
        }
      ]
    }
  ,
    output: {
      filename: minify ? "d3graphs.min.js" : "d3graphs.js"
    }
  ,
    plugins: !minify ? [] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({mangle: false, sourcemap: false}),
    ]
  };

};