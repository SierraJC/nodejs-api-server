// const dateFormat = require('dateformat');
const fs = require('fs');
const dateFormat = require('date-fns/format');
const conf = require('./config/config.js');

module.exports = class RootInterface {
	constructor() {
		if (conf && conf('env') == 'prod')
			this._logDateFormat = 'dd/MM HH:mm:ss';
		this.prependStr = () => `${this._logDateFormat ? dateFormat(new Date(), this._logDateFormat) + ' ' : ''}[${this.constructor.name}]`;

		this.log = console.log.bind(console, this.prependStr());
		this.info = console.info.bind(console, this.prependStr());
		this.debug = console.debug.bind(console, this.prependStr());
		this.warn = console.warn.bind(console, this.prependStr());
		this.error = console.error.bind(console, this.prependStr());

	}

	// log() {
	// [].unshift.call(arguments, `${this._logDateFormat ? dateFormat(new Date(), this._logDateFormat)+' ':''}[${this.constructor.name}]`);
	// console.log.apply(console,arguments);
	// return console.log.bind(console, `[${this.constructor.name}] `);
	// }
	// error() {
	// 	[].unshift.call(arguments, `${this._logDateFormat ? dateFormat(new Date(), this._logDateFormat)+' ':''}! [${this.constructor.name}]`);
	// 	console.error.apply(console,arguments);
	// 	return false;
	// }
	// debug() {
	// 	[].unshift.call(arguments, `${this._logDateFormat ? dateFormat(new Date(), this._logDateFormat)+' ':''}* [${this.constructor.name}]`);
	// 	console.debug.apply(console,arguments);
	// }

	exit() { }

	dump_obj(fileName, obj) {
		return fs.writeFileSync(fileName, JSON.stringify(obj));
	}

};