global.conf = require('./config/config.js');
const RootInterface = require('./_interface');
const pluginManager = require('./plugin_loader');

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

new class Main extends RootInterface {
	async main() {

		global.pluginManager = pluginManager;
		pluginManager.loadAll('./services/');

		var db = pluginManager.get('mongodb');
		var app = express();


		await db.connect();

		app.set('trust proxy', 1); // trust first proxy
		app.set('x-powered-by', false); // trust first proxy

		app.use(session({
			secret: conf('app.secret'),
			resave: false,
			saveUninitialized: false,
			cookie: conf('env') == 'prod' ? { domain: 'sierrapresents.live', secure: true } : { domain: conf('app.host'), secure: false },
			store: MongoStore.create({
				client: db.client.connection.getClient(),
				//dbName: 'sessions'
				collectionName: 'sessions'
			})
		}));

		app.use(express.json());
		app.use(express.urlencoded({ extended: false }));

		app.listen(conf('app.port'), conf('app.host'), async () => {
			this.log(`API Server is running @ http://${conf('app.host')}:${conf('app.port')}/`);
		});

	}
	errorHandler(err) {
		this.error(`Caught Error: ${err.message}`);
		if (err.stack) this.error(err.stack);
	}
	exit() {

	}

	constructor() {
		super();
		process.on('exit', () => { this.log('!! Shutting down !!'); this.exit(); });
		process.on('SIGINT', () => process.exit(0));
		process.on('SIGTERM', () => process.exit(0));
		this.main().then(() => {
			try { process.send('ready'); } catch (err) { () => { }; }  // Notify PM2
		}).catch(err => {
			this.error(err);
		});
	}
}();