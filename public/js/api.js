/**
 * Global API helpers for Phantasmagoria platform.
 * Standardizes fetch calls, CSRF token inclusion, and error handling.
 */

async function getAuthHeaders() {
    const csrfToken = await getCsrfToken();
    return {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
    };
}

async function handleResponse(res) {
    const contentType = res.headers.get('content-type');
    let data = {};
    
    if (contentType && contentType.includes('application/json')) {
        data = await res.json();
    } else {
        const text = await res.text();
        // If it's not JSON but was expected to be, it's likely an HTML error page
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}. ${text.substring(0, 100)}...`);
        }
        return text;
    }

    if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
    }

    // Return the nested data if it follows the { success: true, data: { ... } } pattern
    return data.data || data;
}

async function apiGet(endpoint) {
    const res = await fetch(endpoint, { credentials: 'include' });
    return await handleResponse(res);
}

async function apiPost(endpoint, body = {}) {
    const headers = await getAuthHeaders();
    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body)
    });
    return await handleResponse(res);
}

async function apiPut(endpoint, body = {}) {
    const headers = await getAuthHeaders();
    const res = await fetch(endpoint, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(body)
    });
    return await handleResponse(res);
}

async function apiDelete(endpoint) {
    const headers = await getAuthHeaders();
    const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        credentials: 'include'
    });
    return await handleResponse(res);
}
