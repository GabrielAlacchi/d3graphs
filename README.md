# d3graphs

Graphing library built using d3.js release v4

![alt tag](https://s31.postimg.org/ir2upw9e3/screenshot.png)

# Installation

From the Repository:

`git clone https://github.com/GabrielAlacchi/d3graphs.git`<br>
`npm install`

# Usage

<p>d3graphs.js, d3graphs.min.js and d3graphs.css will be available in the dist/ folder after the installation is complete. You can copy the contents into your project folder and include them with a script tag. </p>

# es2015 + Babel

If you want to use the es2015 source directly, you can import from d3graphs.js from the lib/ folder. <br>
`import d3graphs from 'lib/d3graphs'`<br>
`var d3graphs = require('d3graphs')`
<p>Note: You'll need the plugin "babel-plugin-transform-builtin-extend" since some of the code in the library extends the builtin class `"Array". To use it add the following in your babel config.</p>

`plugins: ['babel-plugin-transform-builtin-extend', {globals: ["Error", "Array"]}, (other plugins)... ]`
