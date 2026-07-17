import js from '@eslint/js'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import stylistic from '@stylistic/eslint-plugin'
import importPlugin from 'eslint-plugin-import-x'
import jestPlugin from 'eslint-plugin-jest'
import globals from 'globals'
import tseslint from 'typescript-eslint'


export default tseslint.config(
	{
		ignores: [
			'dist/**',
			'dist_bin/**',
			'coverage/**',
			'jest-html-reporters-attach/**',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	comments.recommended,
	{
		files: ['**/*.ts'],
		plugins: {
			'@stylistic': stylistic,
			import: importPlugin,
			jest: jestPlugin,
		},
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: 'module',
			parserOptions: {
				project: ['./tsconfig.json'],
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				...globals.node,
				Atomics: 'readonly',
				SharedArrayBuffer: 'readonly',
			},
		},
		rules: {
			indent: 'off',
			'@stylistic/indent': [
				'error',
				'tab',
				{
					FunctionDeclaration: { body: 1, parameters: 2 },
					FunctionExpression: { body: 1, parameters: 2 },
					SwitchCase: 1,
				},
			],
			'linebreak-style': ['error',  'unix'],
			'@stylistic/quotes': [
				'error',
				'single',
				{ avoidEscape: true },
			],
			curly: ['error', 'all'],
			'comma-dangle': [
				'error',
				'always-multiline',
			],
			'no-console': 'off',
			'no-process-exit': 'error',
			'no-template-curly-in-string': 'error',
			'require-await': 'off',
			'@stylistic/semi': ['error', 'never'],
			'@stylistic/member-delimiter-style': [
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
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/explicit-function-return-type': ['error', {
				allowExpressions: true,
			}],
			'@typescript-eslint/explicit-module-boundary-types': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'no-use-before-define': 'off',
			'@typescript-eslint/no-use-before-define': [
				'error',
				{ functions: false, classes: false, enums: false, variables: true },
			],
			'@typescript-eslint/no-require-imports': 'error',
			'@typescript-eslint/ban-ts-comment': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@stylistic/space-infix-ops': 'error',
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/comma-spacing': ['error'],
			'@stylistic/type-annotation-spacing': 'error',

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
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'default',
					format: ['camelCase'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow',
					// interfaces on the Hub are snake_case
					filter: {
						regex: '^(driver_id|driver_name|log_level|driver_id|driver_name|archive_hash)$',
						match: false,
					},
				},
				{
					selector: 'variable',
					format: ['camelCase', 'UPPER_CASE'],
					leadingUnderscore: 'allow',
					trailingUnderscore: 'allow',
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
				{
					selector: 'objectLiteralProperty',
					format: ['camelCase', 'PascalCase'],
				},
				{
					selector: 'enumMember',
					format: ['PascalCase', 'UPPER_CASE'],
				},
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase'],
				},
			],
		},
	},
)
