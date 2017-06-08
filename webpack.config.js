let path = require('path')

module.exports = {
   entry: path.join(__dirname, 'src/index.js'),
   output: {
      path: path.join(__dirname, 'dist'),
      filename: 'app.bundle.js'
   },
   node: {
      fs: 'empty',
      net: 'empty'
   },
   devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 8000,
      stats: 'errors-only'
   },
   module: {
      loaders: [
         {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
         },
         {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
               presets: ['es2015', 'stage-2', 'react']
            }
         }
      ]
   }
}
