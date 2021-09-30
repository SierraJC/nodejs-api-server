const RouteLib = require('../_interface');
const conf = require('../../config/config.js');

const express = require('express');
const router = express.Router();
const axios = require('axios');

const utils = require('../../utils');
const { URL } = require('url');

const twitchViewer = require('../../models/twitchViewer');


//todo: expired token refresh



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
			force_verify: true//conf('env') == 'dev',
		});

		this.ttvTokenVerify = 'https://id.twitch.tv/oauth2/token';

	}

	async init(opts) {

		let app = opts.app;

		router.get('/', async (req, res, next) => {
			if (req.query.error && req.query.error_description) {
				// Error, user probably denied the auth on twitch website
				if (req.query.state) {
					try {
						let state = JSON.parse(req.query.state);
						let redir = new URL(state.redir);
						redir.searchParams.append('success', false);
						redir.searchParams.append('error', req.query.error);
						redir.searchParams.append('error_description', req.query.error_description);
						res.redirect(redir);
					} catch (err) {
						next(utils.makeError(400, 'Invalid state'));
					}
				} else {
					// No original state, force reauthentication attempt
					res.redirect(this.ttvAuthURL + '&' + new URLSearchParams({ state: JSON.stringify(req.query) }));
				}

			} else if (!req.query.code) {
				if (!req.query.redir || !utils.isValidURL(req.query.redir)) {
					next(utils.makeError(400, 'Invalid/empty redir parameter'));
				} else {
					if (req.session.twitch) {
						if (req.query.redir)
							res.redirect(req.query.redir);
						else
							res.send(req.session.twitch.user);
					} else
						res.redirect(this.ttvAuthURL + '&' + new URLSearchParams({ state: JSON.stringify(req.query) }));
				}
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
							token: reqToken.data.access_token,
							refresh: reqToken.data.refresh_token,
							expires_in: reqToken.data.expires_in,
							user: reqUser
						};
						if (req.query.state) {
							let state = JSON.parse(req.query.state);
							if (state.redir) {
								let redir = new URL(state.redir);
								redir.searchParams.append('success', true);
								res.redirect(redir);
							} else
								res.redirect(this.root + '/status');
						} else
							res.send({ status: 200, message: 'You are now logged in' });
					} else
						next(utils.makeError(401, 'Invalid twitch token'));
				} else
					next(utils.makeError(401, 'Invalid authentication code'));
			}

		});

		router.get('/status', async (req, res, next) => {

			if (req.session.twitch) {
				let user = req.session.twitch.user;
				if (user) {
					let begin = Date.now();
					let botUser = await twitchViewer.findOne({ _id: user.id });
					let end = Date.now();
					res.send({ ... { benchmark: (end - begin) }, ...{ botUser: botUser._doc }, ... { cookie: req.session.twitch } });
				}
			} else {
				res.redirect(this.root);
			}
		});

		app.use(this.root, router);
		return true;
	}

	async unload() {
		return true;
	}

}();