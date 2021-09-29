module.exports = {
	'env': {
		'commonjs': true,
		'es6': true,
		'node': true
	},
	'extends': 'eslint:recommended',
	'globals': {
		'Atomics': 'readonly',
		'SharedArrayBuffer': 'readonly'
	},
	'parserOptions': {
		'ecmaVersion': 2018
	},
	'rules': {
		'indent': ['error', 'tab'],
		'no-undef': 'off',
		'linebreak-style': ['error', 'windows'],
		'quotes': ['error', 'single'],
		'semi': ['error', 'always'],
		'no-unused-vars': ['error', { "argsIgnorePattern": ["^_","next"] }]
	}
};