var path = require('path')

const config = {
    entry: './examples/cars/src/entry.js',
    output: {
        path: path.resolve(__dirname, 'examples/cars/build'),
        filename: 'bundle.js'
    },
    // module: {
    //   loaders: [
    //     { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    //   ]
    // }
}

module.exports = config