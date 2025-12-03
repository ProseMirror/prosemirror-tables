import { defineESLintConfig } from '@ocavue/eslint-config';

export default defineESLintConfig({}, [
    {
        rules: {
            "unicorn/prefer-math-trunc": "off",
            "unicorn/no-for-loop": 'off'
        }
    }
]);
