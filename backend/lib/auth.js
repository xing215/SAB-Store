const { betterAuth } = require("better-auth");
const { MongoClient } = require("mongodb");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const { admin } = require("better-auth/plugins");
const { username } = require("better-auth/plugins");
const { jwt } = require("better-auth/plugins");

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
	throw new Error('MONGODB_URI environment variable is required');
}

// Create MongoDB connection
const client = new MongoClient(MONGODB_URI);
const db = client.db();

const auth = betterAuth({
	database: mongodbAdapter(db),
	baseURL: process.env.BASE_URL || "http://localhost:5000",
	secret: process.env.JWT_SECRET,
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 6,
		maxPasswordLength: 128,
	},
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 30,
		}),
		admin({
			defaultRole: "user",
			adminRoles: ["admin"],
			adminUserIds: [],
		}),
		jwt({
			jwt: {
				issuer: process.env.BASE_URL || "http://localhost:5000",
				audience: process.env.BASE_URL || "http://localhost:5000",
				expirationTime: "15m",
				definePayload: ({ user }) => {
					return {
						id: user.id,
						email: user.email,
						username: user.username,
						role: user.role,
						name: user.name,
					};
				},
			},
		}),
	],
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "user",
				required: false,
			},
		},
	},
});

module.exports = { auth };
