module.exports = {
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	env: {
		commonjs: true,
		es6: true,
		node: true,
	},
	extends: 'plugin:@typescript-eslint/recommended',
	globals: {
		'Atomics': 'readonly',
		'SharedArrayBuffer': 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2018,
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
		'comma-dangle': ['error', 'always-multiline'],
		semi: ['error', 'never'],
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
		// TODO: fix and make 'error'
		'@typescript-eslint/no-non-null-assertion': 'warn',
		'no-use-before-define': 'off',
		'@typescript-eslint/no-use-before-define': [
			// TODO: fix variables make 'error'
			'warn',
			{ functions: false, classes: false, enums: false, variables: true }
		]
	},
}
