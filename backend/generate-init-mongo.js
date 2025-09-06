#!/usr/bin/env node

/**
 * Generate Better-Auth MongoDB Schema
 * This script creates the necessary MongoDB collections and initial data
 */

const { MongoClient } = require("mongodb");
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
	console.error('❌ MONGODB_URI environment variable is required');
	process.exit(1);
}

async function generateSchema() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');

		const db = client.db();

		// Create collections with proper indexes for better-auth
		const collections = [
			{
				name: 'user',
				indexes: [
					{ email: 1 },
					{ username: 1 },
					{ role: 1 }
				]
			},
			{
				name: 'session',
				indexes: [
					{ userId: 1 },
					{ token: 1 },
					{ expiresAt: 1 }
				]
			},
			{
				name: 'account',
				indexes: [
					{ userId: 1 },
					{ providerId: 1 },
					{ accountId: 1 }
				]
			},
			{
				name: 'verification',
				indexes: [
					{ identifier: 1 },
					{ expiresAt: 1 }
				]
			}
		];

		for (const collection of collections) {
			try {
				// Create collection if it doesn't exist
				const collectionExists = await db.listCollections({ name: collection.name }).hasNext();

				if (!collectionExists) {
					await db.createCollection(collection.name);
					console.log(`✅ Created collection: ${collection.name}`);
				} else {
					console.log(`ℹ️  Collection already exists: ${collection.name}`);
				}

				// Create indexes
				const dbCollection = db.collection(collection.name);
				for (const index of collection.indexes) {
					try {
						await dbCollection.createIndex(index, { background: true });
						console.log(`   ➡️ Created index: ${JSON.stringify(index)} on ${collection.name}`);
					} catch (indexError) {
						if (indexError.code !== 85) { // Index already exists
							console.warn(`   ⚠️ Index warning: ${indexError.message}`);
						}
					}
				}
			} catch (error) {
				console.error(`❌ Error creating collection ${collection.name}:`, error.message);
			}
		}

		console.log('✅ MongoDB schema generation completed!');
		console.log('\nNext steps:');
		console.log('1. Run: npm run init-db (to create admin user and sample data)');
		console.log('2. Run: npm run dev (to start the server)');

	} catch (error) {
		console.error('❌ Error generating schema:', error);
		process.exit(1);
	} finally {
		await client.close();
	}
}

if (require.main === module) {
	generateSchema();
}

module.exports = { generateSchema };
