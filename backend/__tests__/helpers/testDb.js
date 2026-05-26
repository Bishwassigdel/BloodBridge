/**
 * testDb.js — Spins up a real MongoDB in memory for integration tests.
 * No cloud DB needed. Each test suite gets a fresh, isolated database.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

/** Call in beforeAll() — starts the in-memory MongoDB and connects mongoose */
export const connectTestDB = async () => {
  // If already connected (from a previous test file), disconnect first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

/** Call in afterAll() — drops DB, closes connection, stops the server */
export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

/** Call in afterEach() — wipes all collections between tests */
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
