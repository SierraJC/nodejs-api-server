const RootInterface = require('../_interface');

module.exports = class ServiceLib extends RootInterface {
	constructor() {
		super();
		this.id = this.constructor.name;
		this._priority = 50; // 0-100 ( < 10 await init)
	}
	log(msg) {
		super.log(msg);
	}
};