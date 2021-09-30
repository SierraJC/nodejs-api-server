module.exports = {

	isValidURL(s) {
		try {
			new URL(s);
			return true;
		} catch (err) {
			return false;
		}
	},

	makeError(code, message) {
		let error = new Error(message);
		error.status = code;
		return error;
	},

};