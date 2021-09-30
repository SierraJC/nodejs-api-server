const mongoose = require('mongoose');



const twitchViewerSchema = new mongoose.Schema({
	_id: { type: String },
	username: { type: String },
	display_name: { type: String },
	watch_time: { type: Number, default: 0 },
	last_seen: { type: Number, default: 0 },
	last_redeem: { type: Number, default: 0 },
	chat_lines: { type: Number, default: 0 },
	points_spent: { type: Number, default: 0 },
	last_message: {
		text: { type: String },
		time: { type: Number }
	}
}, { collection: 'twitch' });

module.exports = mongoose.model('twitchViewer', twitchViewerSchema);