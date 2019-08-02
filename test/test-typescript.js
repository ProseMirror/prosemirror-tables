const { checkDirectory } = require('typings-tester');

describe('TypeScript definitions', function() {
  it('should compile against index.d.ts', () => {
    checkDirectory(__dirname + '/typescript')
  })
})