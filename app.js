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

		const
			app = express(),
			routes = require('./routes'),
			// router = express.Router(),
			db = pluginManager.get('mongodb');

		await db.connect();

		app.set('trust proxy', 1); // trust first proxy
		app.set('x-powered-by', false); // trust first proxy
		app.use(express.json());
		app.use(express.urlencoded({ extended: false }));

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

		routes(app);

		// Error handler
		app.use((req, res, next) => {
			const error = new Error('Not found');
			error.status = 404;
			next(error, req, res);
		});

		app.use((error, req, res, next) => {
			res.status(error.status || 500).send({
				status: error.status || 500,
				message: error.message || 'Internal Server Error',
				stack: conf('env') == 'dev' ? error.stack : undefined
			});
			this.error(error);
			next();
		});

		await app.listen(conf('app.port'), conf('app.host'));
		this.log(`API Server is running @ http://${conf('app.host')}:${conf('app.port')}/`);

		return true;

	}
	errorHandler(err) {
		this.error(`Caught Error: ${err.message}`);
		if (err.stack) this.error(err.stack);
	}
	exit() {
		try {
			pluginManager.unloadAll('./services/');
		} catch (err) {
			console.error('Error during plugin unloading. Bad luck!');
			console.error(err);
		}
	}

	constructor() {
		super();
		process.on('exit', () => { this.log('!! Shutting down !!'); this.exit(); });
		process.on('SIGINT', () => process.exit(0));
		process.on('SIGTERM', () => process.exit(0));
		this.main().then((ready) => {
			if (ready)
				try { process.send('ready'); } catch (err) { () => { }; }  // Notify PM2
			else this.exit();
		});
		// .catch(err => {
		// 	this.error(err);
		// });
	}
}();