import { checkDirectory } from 'typings-tester';
import path from 'path';
import { fileURLToPath } from 'url';

describe('TypeScript definitions', function () {
  it('should compile against index.d.ts', () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    checkDirectory(__dirname + '/typescript');
  });
});
