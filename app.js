global.conf = require('./config');
var express = require('express');
var session = require('express-session');

var app = express();

app.set('trust proxy', 1) // trust first proxy
app.set('x-powered-by', false) // trust first proxy

app.use(session({
	secret: conf('app.secret'),
	resave: false,
	saveUninitialized: false,
	cookie: { domain: 'sierrapresents.live', secure: conf('env') == 'prod' }
}))

app.listen(conf('app.port'), conf('app.host'), function () {
	try { process.send('ready'); } catch (err) { () => { }; }  // Notify PM2
	console.log(`API Server is running @ http://${conf('app.host')}:${conf('app.port')}/`);
});