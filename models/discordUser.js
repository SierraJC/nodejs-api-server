const mongoose = require('mongoose');

const discordUserSchema = new mongoose.Schema({
	_id: { type: String },
	twitch_id: { type: Number, default: null },
	joined_vc: { type: Number, default: null },
	voice_time: { type: Number, default: null },
}, { collection: 'discord' });

module.exports = mongoose.model('discordUser', discordUserSchema);