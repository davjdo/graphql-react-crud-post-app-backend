const bcrypt = require('bcryptjs');

// Import model
const User = require('../models/user');

module.exports = {
	createUser: async function({ userInput }, req) {
		// const email = args.userInput.email;
		const existingUser = await User.findOne({ email: userInput.email });
		if (existingUser) {
			const error = new Error('User already exists!');
			throw error;
		}
		const hashedPw = await bcrypt.hash(userInput.password, 12);
		const user = new User({
			email: userInput.email,
			name: userInput.name,
			password: userInput.password
		});
		const createdUser = await user.save();
		return { ...createdUser._doc, _id: createdUser._id.toString() };
	}
};
