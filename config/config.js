require('dotenv').config();
const convict = require('convict');

const config = convict({
	env: {
		format: ['prod', 'dev'],
		default: 'dev',
		arg: 'nodeEnv',
		env: 'NODE_ENV'
	},
	app: {
		host: { format: '*', default: false },
		port: { format: 'port', default: false },
		secret: { format: '*', default: false, sensitive: true },
	},
	twitch: {
		clientId: { format: '*', default: false },
		secret: { format: '*', default: false, sensitive: true },
		redir: { format: 'url', default: false },
	},
	db: {
		host: { format: '*', default: false },
		username: { format: '*', default: false },
		password: { format: '*', default: false, sensitive: true },
		database: { format: '*', default: false },
		tunnel: { format: '*', default: null },
	},
});

config.loadFile(`config/${config.get('env')}.json5`);
config.validate({ allowed: 'strict' });

module.exports = function (prop, value) {
	if (value !== undefined) {
		config.set(prop, value);
		return value;
	} else {
		return config.get(prop);
	}
};