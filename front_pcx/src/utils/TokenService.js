// TokenService.js
import axios from 'axios';

const TokenService = {
    getTokenPair: async (username, password) => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/', { username, password });

            if (response.status === 200) {
                const { access, refresh } = response.data;
                return { access, refresh };
            } else {
                throw new Error('Failed to fetch token pair');
            }
        } catch (error) {
            throw new Error('Failed to fetch token pair: ' + error.message);
        }
    },

    refreshToken: async (refreshToken) => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh: refreshToken });

            if (response.status === 200) {
                const { access } = response.data;
                return access;
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            throw new Error('Failed to refresh token: ' + error.message);
        }
    },
};

export default TokenService;
