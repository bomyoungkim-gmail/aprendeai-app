const axios = require('axios');

async function testLogin() {
  try {
    console.log('Attempting login...');
    // Note: Hardcoded URL for local debugging only. For app code use @/lib/config/urls
    console.log('URL: http://localhost:4000/api/v1/auth/login');
    const res = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email: 'facilitator@e2e-test.com',
      password: 'Test123!@#'
    });
    console.log('Login Successful!');
    console.log('User ID:', res.data.user.id);
  } catch (err) {
    if (err.response) {
      console.error('Login Failed:', err.response.status, err.response.data);
    } else {
      console.error('Network/Connection Error:', err.message);
    }
  }
}

testLogin();
