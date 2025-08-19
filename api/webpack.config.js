import Path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

export default {
  entry: './server.ts',
  mode: 'production',
  target: 'node',   // 👈 important: don't try to polyfill 'fs', 'path', etc
  output: {
    path: Path.resolve(__dirname, '.'),
    filename: 'server.bundle.cjs'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};