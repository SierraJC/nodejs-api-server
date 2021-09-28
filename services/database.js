const Service = require('./_interface');

const fs = require('fs');
const mongoose = require('mongoose');
const tunnel = require('tunnel-ssh');

module.exports = new class DatabaseService extends Service {
	constructor() {
		super();
		this._priority = 1; // High Priority

		this.mongoURL = `mongodb://${conf('db.host')}/${conf('db.database')}?authSource=admin`;
		this.client = null;
		this.db = null;
		this.tunnel = null;
		this.ready = false;

	}

	async init() {
		this.db = mongoose.connection;
		this.db.on('error', this.error);
		this.db.on('open', this.onConnected.bind(this));
		this.db.on('close', this.onDisconnected.bind(this));
		this.db.on('reconnected', this.onConnected.bind(this));

		return this;
	}

	async unload() {
		await this.disconnect();
		return true;
	}

	onConnected() {
		this.ready = true;
		this.log(`Connected to MongoDB @ ${conf('db.host')} -> ${conf('db.database')}`);
	}

	onDisconnected() {
		this.ready = false;
		this.log('Disconnected from MongoDB');
	}

	connected() {
		return this.db.readyState == 1;
	}

	async connect() {
		this.ready = false;
		if (conf('db.tunnel')) {
			this.tunnel = await tunnel({
				host: conf('db.tunnel.host'),
				port: conf('db.tunnel.port'),
				dstPort: conf('db.tunnel.destPort'),
				username: conf('db.tunnel.username'),
				password: conf('db.tunnel.password'),
				privateKey: fs.readFileSync(conf('db.tunnel.privateKey')),
				keepAlive: true
			});
		}

		this.client = await mongoose.connect(this.mongoURL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,

			user: conf('db.username'), pass: conf('db.password')
		});

		return this.client;
	}

	async disconnect() {
		this.ready = false;
		if (this.connected())
			await this.client.disconnect();
		if (this.tunnel.listening)
			await this.tunnel.close();
	}

}();