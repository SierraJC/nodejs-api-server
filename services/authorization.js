const Service = require('./_interface');

const jwt = require('express-jwt');
const conf = require('../config/config.js');

module.exports = new class jwtAuth extends Service {
	constructor() {
		super();
		this._priority = 50; // 1 (High) - 100 (Low)

		this.conf = conf('app.jwt'); //? Stored here so every jwtRequired doesnt need to keep calling conf() ?

		this.jwtRequired = jwt({
			secret: this.conf.secret,
			algorithms: this.conf.algorithms,
			requestProperty: 'auth',
			getToken: function fromHeaderOrQuerystring(req) {
				if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
					return req.headers.authorization.split(' ')[1];
				} else if (req.query && req.query.token) {
					return req.query.token;
				}
				return null;
			}
		});

	}

	async init(_opts = {}) {
		return this;
	}

	async unload() {
		return true;
	}



}();