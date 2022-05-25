import { checkDirectory } from 'typings-tester';

describe('TypeScript definitions', function () {
  it('should compile against index.d.ts', () => {
    // eslint-disable-next-line
    checkDirectory(__dirname + '/typescript');
  });
});
