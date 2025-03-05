// TokenContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import TokenService from './../TokenService';

const TokenContext = createContext();

const TokenProvider = ({ children }) => {
    const [token, setToken] = useState('');

    const getTokenPair = async (username, password) => {
        const { access, refresh } = await TokenService.getTokenPair(username, password);
        setToken(access);
        // Store the refresh token securely if needed
        // Example: localStorage.setItem('refreshToken', refresh);
    };

    const refreshToken = async () => {
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (storedRefreshToken) {
            const newToken = await TokenService.refreshToken(storedRefreshToken);
            setToken(newToken);
        }
    };

    const checkTokenExpiry = () => {
        // Calculate the time in milliseconds for token refresh (one minute before expiry)
        const tokenRefreshTime = 60 * 1000;
    
        const checkExpiryInterval = setInterval(async () => {
            const tokenExpiryTime = getTokenExpiryTime(); // Get the token's expiry time
    
            const currentTime = new Date().getTime(); // Current time in milliseconds
            const timeToExpiry = tokenExpiryTime - currentTime;
    
            if (timeToExpiry < tokenRefreshTime && timeToExpiry >= 0) {
                clearInterval(checkExpiryInterval); // Clear the interval to avoid multiple triggers
    
                // Calculate the dynamic interval to refresh the token one minute before expiry
                const refreshInterval = timeToExpiry - tokenRefreshTime;
    
                setTimeout(async () => {
                    // Call your token refresh function (for example: refreshToken())
                    await refreshToken();
    
                    // Call the token check function again for the next cycle
                    checkTokenExpiry();
                }, refreshInterval);
            }
        }, 60 * 1000); // Check token expiry every minute
    };

    const getTokenExpiryTime = (token) => {
        // Split the token into its parts: header, payload, signature
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
    
        // The 'exp' field in the payload contains the expiry time
        const expiryTimeInSeconds = payload.exp;
    
        // Convert the expiry time from seconds to milliseconds
        const expiryTimeMilliseconds = expiryTimeInSeconds * 1000;
    
        return expiryTimeMilliseconds;
    };


    useEffect(() => {
        checkTokenExpiry();
    }, []);

    return (
        <TokenContext.Provider value={{ token, getTokenPair, refreshToken }}>
            {children}
        </TokenContext.Provider>
    );
};

const useToken = () => useContext(TokenContext);

export { TokenProvider, useToken };
