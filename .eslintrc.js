module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
		'import',
		'jest',
		'eslint-comments',
	],
	env: {
		commonjs: true,
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:eslint-comments/recommended',
	],
	globals: {
		'Atomics': 'readonly',
		'SharedArrayBuffer': 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2019,
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	rules: {
		indent: 'off',
		'@typescript-eslint/indent': [
			'error',
			'tab',
			{
				FunctionDeclaration: { body: 1, parameters: 2 },
				FunctionExpression: { body: 1, parameters: 2 },
				SwitchCase: 1,
			},
		],
		'linebreak-style': ['error',  'unix'],
		quotes: 'off',
		'@typescript-eslint/quotes': [
			'error',
			'single',
			{ avoidEscape: true },
		],
		curly: ['error', 'all'],
		'comma-dangle': [
			'error',
			'always-multiline',
		],
		'no-console': 'error',
		'no-process-exit': 'error',
		'no-template-curly-in-string': 'error',
		'require-await': 'off',
		semi: 'off', // disable to allow @typescript-eslint/semi to do its job
		'@typescript-eslint/semi': ['error', 'never'],
		'@typescript-eslint/member-delimiter-style': [
			'error',
			{
				multiline: {
					delimiter: 'none',
					requireLast: true,
				},
				singleline: {
					delimiter: 'semi',
					requireLast: false,
				},
			},
		],
		'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
		'@typescript-eslint/explicit-function-return-type': ['error', {
			allowExpressions: true,
		}],
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-non-null-assertion': 'error',
		'no-use-before-define': 'off',
		'@typescript-eslint/no-use-before-define': [
			'error',
			{ functions: false, classes: false, enums: false, variables: true },
		],
		'@typescript-eslint/no-var-requires': 'error',
		'@typescript-eslint/ban-ts-ignore': 0,
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-floating-promises': 'error',
		'space-infix-ops': 'off',
		'@typescript-eslint/space-infix-ops': 'error',
		'object-curly-spacing': 'off',
		'@typescript-eslint/object-curly-spacing': ['error', 'always'],
		'comma-spacing': 'off',
		'@typescript-eslint/comma-spacing': ['error'],

		// disallow non-import statements appearing before import statements
		'import/first': 'error',
		// Require a newline after the last import/require in a group
		'import/newline-after-import': ['error', { 'count': 2 }],
		// Forbid import of modules using absolute paths
		'import/no-absolute-path': 'error',
		// disallow AMD require/define
		'import/no-amd': 'error',
		// Forbid mutable exports
		'import/no-mutable-exports': 'error',
		// Prevent importing the default as if it were named
		'import/no-named-default': 'error',
		// Prohibit named exports
		'import/no-named-export': 'off', // we want everything to be a named export
		// Forbid a module from importing itself
		'import/no-self-import': 'error',
		// Require modules with a single export to use a default export
		'import/prefer-default-export': 'off', // we want everything to be named
	},
}
