const conf = require('./config/config.js');
const RootInterface = require('./_interface');
const PluginLoader = require('./plugin_loader');

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

global.App = new class Main extends RootInterface {
	async main() {
		this.Services = new PluginLoader();
		await this.Services.loadAll('./services/');
		// todo: abandon plugin loader unload feature? change loadAll to return unique instance per dir loaded

		const
			app = express(),
			routes = require('./routes/_router.js'),
			db = this.Services.get('database');

		await db.connect();

		app.set('trust proxy', 1); // trust first proxy
		app.set('x-powered-by', false);

		app.use(express.json());
		app.use(express.urlencoded({ extended: false }));

		app.use(session({
			secret: conf('app.secret'),
			resave: false,
			saveUninitialized: false,
			cookie: {
				domain: conf('app.cookieDomain'),
				maxAge: 5 * 60 * 1000, // 5 minutes
				secure: conf('env') == 'prod',
				httpOnly: true
			},
			store: MongoStore.create({
				client: db.client.connection.getClient(),
				//dbName: 'sessions'
				collectionName: 'sessions'
			})
		}));

		await routes(app);

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
				// stack: conf('env') == 'dev' ? error.stack : undefined
			});
			this.error(`${error.status} ${error.message}: ${req.url}`);
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
			Services.unloadAll('./services/');
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