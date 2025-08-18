/**
 * Simple test script to verify BibleBridge Backend API functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 Testing BibleBridge Backend API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log(`   Status: ${healthResponse.data.data.status}`);
    console.log(`   Uptime: ${healthResponse.data.data.uptime}s\n`);

    // Test 2: Get translations
    console.log('2. Testing translations endpoint...');
    const translationsResponse = await axios.get(`${BASE_URL}/translations`);
    console.log('✅ Translations endpoint passed');
    console.log(`   Available translations: ${translationsResponse.data.data.translations.filter(t => t.available).map(t => t.code).join(', ')}\n`);

    // Test 3: Get books
    console.log('3. Testing books endpoint...');
    const booksResponse = await axios.get(`${BASE_URL}/books`);
    console.log('✅ Books endpoint passed');
    console.log(`   Total books: ${booksResponse.data.data.books.length}`);
    console.log(`   Old Testament: ${booksResponse.data.meta.oldTestament}`);
    console.log(`   New Testament: ${booksResponse.data.meta.newTestament}\n`);

    // Test 4: Get specific chapter
    console.log('4. Testing chapter endpoint...');
    const chapterResponse = await axios.get(`${BASE_URL}/translations/KJV/John/3`);
    console.log('✅ Chapter endpoint passed');
    console.log(`   Book: ${chapterResponse.data.data.book}`);
    console.log(`   Chapter: ${chapterResponse.data.data.chapter}`);
    console.log(`   Verses: ${chapterResponse.data.data.verses.length}`);
    console.log(`   First verse: "${chapterResponse.data.data.verses[0].text.substring(0, 50)}..."\n`);

    // Test 5: Search functionality
    console.log('5. Testing search endpoint...');
    const searchResponse = await axios.get(`${BASE_URL}/search/KJV?query=love&limit=5`);
    console.log('✅ Search endpoint passed');
    console.log(`   Query: "${searchResponse.data.data.query}"`);
    console.log(`   Results: ${searchResponse.data.data.results.length}`);
    console.log(`   Total: ${searchResponse.data.data.pagination.totalResults}\n`);

    // Test 6: Pronunciations
    console.log('6. Testing pronunciations endpoint...');
    const pronunciationsResponse = await axios.get(`${BASE_URL}/pronunciations/Abraham`);
    console.log('✅ Pronunciations endpoint passed');
    console.log(`   Name: ${pronunciationsResponse.data.data.name}`);
    console.log(`   Phonetic: ${pronunciationsResponse.data.data.pronunciation.phonetic || 'N/A'}`);
    console.log(`   IPA: ${pronunciationsResponse.data.data.pronunciation.ipa || 'N/A'}\n`);

    // Test 7: User position
    console.log('7. Testing user endpoints...');
    const userPositionResponse = await axios.get(`${BASE_URL}/user/position`);
    console.log('✅ User position endpoint passed');
    console.log(`   Current book: ${userPositionResponse.data.data.position.book}`);
    console.log(`   Current chapter: ${userPositionResponse.data.data.position.chapter}\n`);

    // Test 8: Save user position
    console.log('8. Testing save user position...');
    await axios.post(`${BASE_URL}/user/position`, {
      book: 'Matthew',
      chapter: 5,
      verse: 16
    });
    console.log('✅ Save user position passed\n');

    // Test 9: TTS Health (if available)
    console.log('9. Testing TTS health...');
    try {
      const ttsHealthResponse = await axios.get(`${BASE_URL}/tts/health`);
      console.log('✅ TTS health endpoint passed');
      console.log(`   TTS Available: ${ttsHealthResponse.data.data.health.available}`);
      console.log(`   Response Time: ${ttsHealthResponse.data.data.health.responseTime || 'N/A'}ms\n`);
    } catch (error) {
      console.log('⚠️  TTS service not available (this is optional)\n');
    }

    // Test 10: API Info
    console.log('10. Testing API info...');
    const infoResponse = await axios.get(`${BASE_URL}/info`);
    console.log('✅ API info endpoint passed');
    console.log(`   API Name: ${infoResponse.data.data.name}`);
    console.log(`   Version: ${infoResponse.data.data.version}`);
    console.log(`   Features: ${infoResponse.data.data.capabilities.features.length} features\n`);

    console.log('🎉 All tests passed! BibleBridge Backend API is working correctly.');
    console.log('\n📚 Available endpoints:');
    console.log('   - API Documentation: http://localhost:3000/api-docs');
    console.log('   - Health Check: http://localhost:3000/health');
    console.log('   - API Status: http://localhost:3000/api/status');
    console.log('   - Bible Data: http://localhost:3000/api/translations');
    console.log('   - Pronunciations: http://localhost:3000/api/pronunciations');
    console.log('   - User Data: http://localhost:3000/api/user/profile');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Is the server running? Try: npm run dev');
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };