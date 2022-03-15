const { createClient } = require( 'redis' )
let redisClient
redisClient = createClient()

function conntectRedis() {
  redisClient.connect();
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
}

function getRedisClient() {
  return redisClient
}

module.exports = {
  conntectRedis,
  getRedisClient
}