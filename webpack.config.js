const path = require('path')

module.exports = {
   entry: path.join(__dirname, 'src/index.js'),
   output: {
      filename: 'bundle.js',
      path: path.join(__dirname, 'dist'),
   },
   module: {
      rules: [
         {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
         },
         {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [ '@babel/preset-env', '@babel/preset-react']
              }
            }
         }
      ]
   }
}
