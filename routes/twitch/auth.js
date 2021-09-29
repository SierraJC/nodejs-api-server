const RouteLib = require('../_interface');
const conf = require('../../config/config.js');

const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = new class TwithAuth extends RouteLib {
	constructor() {
		super();
		this._priority = 50; // 1 (High) - 100 (Low)
		this.root = '/twitch/auth';

		this.twitchConfig = conf('twitch');

		//* https://dev.twitch.tv/docs/authentication/#scopes
		this.scopes = {
			'user:read:subscriptions': false,
			'user:read:follows': false,
			'user:read:email': false,
		};

		this.ttvAuthURL = 'https://id.twitch.tv/oauth2/authorize?' + new URLSearchParams({
			response_type: 'code',
			client_id: this.twitchConfig.clientId,
			redirect_uri: this.twitchConfig.redir,
			scope: Object.keys(this.scopes).filter((scope) => this.scopes[scope]).join(' '),
			force_verify: true,
		});

		this.ttvTokenVerify = 'https://id.twitch.tv/oauth2/token';

	}

	async init(opts) {

		let app = opts.app;

		router.get('/', async (req, res, next) => {

			if (!req.query.code) {
				if (req.session.twitch) {
					res.send(req.session.twitch.user);
				} else
					res.redirect(this.ttvAuthURL + '&' + new URLSearchParams({ state: JSON.stringify(req.query) }));
			} else {

				let reqData = {
					client_id: this.twitchConfig.clientId,
					client_secret: this.twitchConfig.secret,
					grant_type: 'authorization_code',
					redirect_uri: this.twitchConfig.redir,
					code: req.query.code
				};

				let reqToken = await axios.post(this.ttvTokenVerify, reqData).catch(() => false);

				if (reqToken.data) {
					// result.access_token
					// result.refresh_token
					// result.expires_in

					let reqUser = await axios.get('https://api.twitch.tv/helix/users', {
						headers: {
							'Accept': 'application/vnd.twitchtv.v5+json',
							'Client-Id': this.twitchConfig.clientId,
							'Authorization': 'Bearer ' + reqToken.data.access_token
						}
					}
					).then(res => res.data.data[0]).catch(() => false);

					if (reqUser) {
						// eslint-disable-next-line require-atomic-updates
						req.session.twitch = {
							_id: Number(reqUser.id),
							token: reqToken.data.access_token,
							refresh: reqToken.data.refresh_token,
							user: reqUser
						};
						// res.send(reqUser);
						if (req.query.state) {
							let state = JSON.parse(req.query.state);
							if (state.redir)
								res.redirect(state.redir);
							else
								res.send(reqUser);
						}
					} else {
						const error = new Error('Invalid twitch token');
						error.status = 500;
						next(error);
					}
				} else {
					const error = new Error('Invalid authentication code');
					error.status = 500;
					next(error);
				}
			}

		});

		router.get('/status', (req, res) => {
			res.send(req.session);
		});

		app.use(this.root, router);
		return true;
	}

	async unload() {
		return true;
	}

}();