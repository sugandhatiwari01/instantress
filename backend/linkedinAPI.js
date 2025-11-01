// linkedinAPI.js
const axios = require('axios');

class LinkedInAPI {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseUrl = 'https://api.linkedin.com/v2';
    }

    async getProfile() {
        try {
            const response = await axios.get(`${this.baseUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'cache-control': 'no-cache',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            return response.data;
        } catch (error) {
            console.error('LinkedIn API Error:', error);
            throw error;
        }
    }

    async getProfilePicture() {
        try {
            const response = await axios.get(`${this.baseUrl}/me?projection=(profilePicture)`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'cache-control': 'no-cache',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            return response.data.profilePicture;
        } catch (error) {
            console.error('LinkedIn API Error:', error);
            throw error;
        }
    }

    async getEmailAddress() {
        try {
            const response = await axios.get(`${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'cache-control': 'no-cache',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            return response.data.elements[0]['handle~'].emailAddress;
        } catch (error) {
            console.error('LinkedIn API Error:', error);
            throw error;
        }
    }
}

module.exports = LinkedInAPI;