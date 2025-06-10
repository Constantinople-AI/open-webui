// Auth interceptor for automatic OAuth token refresh
let refreshInProgress = false;
let refreshPromise = null;

// Store original fetch
const originalFetch = window.fetch;

/**
 * Enhanced fetch with automatic token refresh
 * @param {string | Request} url - The URL or Request object
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<Response>}
 */
async function enhancedFetch(url, options = {}) {
    // Ensure headers object exists
    if (!options.headers) {
        options.headers = {};
    }

    // Add auth header if token exists and not already present
    const token = localStorage.getItem('token');
    const headers = options.headers;
    if (token && !headers['Authorization'] && !headers['authorization']) {
        options.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    // Make the initial request
    let response = await originalFetch(url, options);

    // Handle 401 responses with token refresh
    const urlString = url instanceof Request ? url.url : url.toString();
    if (response.status === 401 && !refreshInProgress && !urlString.includes('/oauth/refresh')) {
        // Use a shared promise to prevent multiple refresh attempts
        if (!refreshPromise) {
            refreshInProgress = true;
            refreshPromise = refreshToken();
        }

        try {
            const newToken = await refreshPromise;
            if (newToken) {
                // Retry with new token
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`
                };
                response = await originalFetch(url, options);
            }
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear auth and redirect to login
            localStorage.removeItem('token');
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname + window.location.search;
                window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
            }
        } finally {
            refreshInProgress = false;
            refreshPromise = null;
        }
    }

    return response;
}

/**
 * Token refresh function
 * @returns {Promise<string>}
 */
async function refreshToken() {
    try {
        console.log('Attempting to refresh OAuth token...');
        
        const response = await originalFetch('/oauth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Refresh failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.token) {
            console.log('OAuth token refreshed successfully');
            localStorage.setItem('token', data.token);
            
            // Update user store if it exists
            if (typeof window !== 'undefined' && window.updateUserToken) {
                window.updateUserToken(data.token, data.expires_at);
            }
            
            return data.token;
        } else {
            throw new Error('Invalid refresh response');
        }
    } catch (error) {
        console.error('OAuth token refresh failed:', error);
        throw error;
    }
}

// Install the interceptor
export function setupAuthInterceptor() {
    if (typeof window !== 'undefined') {
        window.fetch = enhancedFetch;
        console.log('OAuth refresh interceptor installed');
    }
}

// Remove the interceptor (for cleanup)
export function removeAuthInterceptor() {
    if (typeof window !== 'undefined') {
        window.fetch = originalFetch;
        console.log('OAuth refresh interceptor removed');
    }
}

/**
 * Manual refresh function for proactive refreshing
 * @returns {Promise<string>}
 */
export async function manualRefresh() {
    if (refreshInProgress) {
        return refreshPromise;
    }
    
    refreshInProgress = true;
    refreshPromise = refreshToken();
    
    try {
        return await refreshPromise;
    } finally {
        refreshInProgress = false;
        refreshPromise = null;
    }
} 