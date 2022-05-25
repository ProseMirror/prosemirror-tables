import { checkDirectory } from 'typings-tester';
import path from 'path';

describe('TypeScript definitions', function () {
  it('should compile against index.d.ts', () => {
    const __dirname = path.resolve();
    checkDirectory(__dirname + '/typescript');
  });
});
