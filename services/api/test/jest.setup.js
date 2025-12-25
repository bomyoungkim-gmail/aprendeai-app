/**
 * Jest Setup File for Integration Tests
 * 
 * This file runs before each test suite to configure the testing environment.
 * It's specified in jest-integration.config.js via setupFilesAfterEnv.
 */

// Fix BigInt JSON serialization
// Without this, JSON.stringify() throws: "TypeError: Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function () {
  return this.toString();
};

console.log('✅ Jest setup: BigInt.prototype.toJSON configured');
