const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCounselorRegistration() {
  console.log('Testing counselor registration with specialization...\n');

  try {
    // Test counselor registration
    const registrationData = {
      email: 'test.counselor@example.com',
      password: 'TestPassword123',
      firstName: 'Dr. Test',
      lastName: 'Counselor',
      role: 'counselor',
      phone: '1234567890',
      profileData: {
        licenseNumber: 'LIC12345',
        specialization: 'Anxiety & Stress Management',
        yearsOfExperience: 5,
        qualifications: 'PhD in Psychology, Licensed Clinical Social Worker'
      }
    };

    console.log('Attempting to register counselor...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, registrationData);
    
    console.log('Registration successful!');
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
    
    // Extract token for authenticated requests
    const token = registerResponse.data.token;
    
    // Test getting user profile
    console.log('\nTesting profile retrieval...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile data:');
    console.log(JSON.stringify(profileResponse.data, null, 2));

    // Test getting available counselors (should not include unapproved)
    console.log('\nTesting counselor availability (should be empty for unapproved)...');
    const counselorsResponse = await axios.get(`${API_BASE}/appointments/counselors`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Available counselors:');
    console.log(JSON.stringify(counselorsResponse.data, null, 2));

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCounselorRegistration();
