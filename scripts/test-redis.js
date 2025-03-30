/**
 * Redis Connection Test Script
 * 
 * This script tests connection to Redis with various configurations
 * to help troubleshoot connection issues.
 * 
 * Usage:
 * node scripts/test-redis.js
 */

require('dotenv').config();
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

console.log('Redis Test Script');
console.log('=================');
console.log('Testing connection to Redis with multiple configurations...');
console.log(`REDIS_URL: ${REDIS_URL ? REDIS_URL.replace(/\/\/.*@/, '//***@') : 'Not set'}`);
console.log(`REDIS_HOST: ${REDIS_HOST}`);
console.log(`REDIS_PORT: ${REDIS_PORT}`);
console.log(`REDIS_PASSWORD: ${REDIS_PASSWORD ? '******' : 'Not set'}`);
console.log('=================\n');

// Test function
async function testRedisConnection(config, name) {
  console.log(`\nTesting ${name}...`);
  
  return new Promise(resolve => {
    let timeoutId;
    
    try {
      const client = new Redis(config);
      
      timeoutId = setTimeout(() => {
        console.log(`❌ ${name}: Connection timeout after 5 seconds`);
        client.disconnect();
        resolve(false);
      }, 5000);
      
      client.on('connect', () => {
        clearTimeout(timeoutId);
        console.log(`✅ ${name}: Connected successfully!`);
        
        // Try PING command
        client.ping().then(result => {
          console.log(`✅ ${name}: PING command successful, result: ${result}`);
          client.disconnect();
          resolve(true);
        }).catch(err => {
          console.error(`❌ ${name}: PING command failed:`, err.message);
          client.disconnect();
          resolve(false);
        });
      });
      
      client.on('error', (err) => {
        clearTimeout(timeoutId);
        console.error(`❌ ${name}: Connection error:`, err.message);
        client.disconnect();
        resolve(false);
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ ${name}: Failed to create connection:`, error.message);
      resolve(false);
    }
  });
}

// Run tests
async function runTests() {
  const results = [];
  
  // Test 1: Direct URL as provided
  if (REDIS_URL) {
    results.push(await testRedisConnection(REDIS_URL, 'Direct URL connection'));
    
    // Test 2: URL with TLS options
    results.push(await testRedisConnection({
      url: REDIS_URL,
      tls: { rejectUnauthorized: false }
    }, 'URL with TLS options'));
  }
  
  // Test 3: Parse URL and connect with components
  if (REDIS_URL) {
    try {
      const url = new URL(REDIS_URL.replace('redis://', 'http://').replace('rediss://', 'https://'));
      const host = url.hostname;
      const port = parseInt(url.port);
      let password = url.password;
      
      if (!password && url.username === 'default' && url.search) {
        password = url.search.substring(1);
      }
      
      results.push(await testRedisConnection({
        host,
        port,
        password,
        tls: { 
          rejectUnauthorized: false,
          servername: host
        }
      }, 'Parsed URL components with TLS'));
      
      // Test without TLS
      results.push(await testRedisConnection({
        host,
        port,
        password
      }, 'Parsed URL components without TLS'));
    } catch (error) {
      console.error('Failed to parse Redis URL:', error.message);
    }
  }
  
  // Test 4: Basic config
  results.push(await testRedisConnection({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined
  }, 'Basic config'));
  
  // Test 5: Try with alternative format for Redis Cloud
  if (REDIS_URL && REDIS_URL.includes('redislabs')) {
    // Try with modified URL (no username)
    const altUrl = REDIS_URL.replace('rediss://default:', 'rediss://:');
    results.push(await testRedisConnection(altUrl, 'Alternative URL format'));
  }
  
  // Results summary
  console.log('\n=================');
  console.log('Results Summary:');
  console.log('=================');
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r).length}`);
  console.log(`Failed: ${results.filter(r => !r).length}`);
  
  if (results.some(r => r)) {
    console.log('\n✅ At least one connection method succeeded!');
    console.log('Use the successful configuration in your application.');
  } else {
    console.log('\n❌ All connection methods failed!');
    console.log('Please check your Redis service and network connectivity.');
  }
}

runTests().catch(err => {
  console.error('Test script error:', err);
}); 