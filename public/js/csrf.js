/**
 * Shared helper to get a fresh CSRF token from the server.
 * This should be called before every state-changing request (POST, PUT, DELETE).
 */
async function getCsrfToken() {
    try {
        const response = await fetch('/api/auth/csrf-token', {
            credentials: 'include'
        });
        
        if (response.status === 429) {
            console.error("Rate limit exceeded while fetching CSRF token.");
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}. Body: ${text.substring(0, 50)}`);
        }

        const data = await response.json();
        
        // Handle the standardized API response format { success: true, data: { csrfToken: "..." } }
        if (data.success && data.data && data.data.csrfToken) {
            return data.data.csrfToken;
        }
        
        return data.csrfToken || null;
    } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        return null;
    }
}
