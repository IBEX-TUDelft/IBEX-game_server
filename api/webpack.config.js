import Path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

export default {
  entry: './server.js',
  mode: 'production',
  target: 'node',
  output: {
    path: Path.resolve(__dirname, '.'),
    filename: 'server.bundle.js'
  }
};