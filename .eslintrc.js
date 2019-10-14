module.exports = {
	'parser': '@typescript-eslint/parser',
	'plugins': [
		'@typescript-eslint'
	],
	'env': {
		'commonjs': true,
		'es6': true,
		'node': true
	},
	'extends': 'plugin:@typescript-eslint/recommended',
	'globals': {
		'Atomics': 'readonly',
		'SharedArrayBuffer': 'readonly'
	},
	'parserOptions': {
		'ecmaVersion': 2018
	},
	'rules': {
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'never'
		],
		'@typescript-eslint/member-delimiter-style': [
			'linebreak'
		]
	}
}
