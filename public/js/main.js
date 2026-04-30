// shared javascript helpers for the frontend

// helpers for api auth and keys
window.getApiKey = () => document.querySelector('meta[name="api-key"]')?.content;
window.getAuthHeaders = () => {
    const key = window.getApiKey();
    if (key && key !== "undefined" && key !== "") {
        return { 'Authorization': `Bearer ${key}` };
    }
    return {};
};

// show popup notifications on the screen
window.showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'success' ? 'bg-success' : 'bg-danger';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    document.getElementById('toast-container').insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
};

// show loading state when clicking buttons
window.setBtnLoading = (btn, isLoading, originalText = 'Submit') => {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || originalText;
    }
};

// handle errors from fetch calls
window.handleFetchError = (err) => {
    console.error('Fetch error:', err);
    window.showToast(err.message || 'An unexpected error occurred. Please try again.', 'error');
};

// wrap fetch to always include cookies and check for expired sessions
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
    init.credentials = init.credentials || 'include';
    
    const response = await originalFetch(input, init);
    if (response.status === 401) {
        const clone = response.clone();
        try {
            const data = await clone.json();
            if (data.error && data.error.toLowerCase().includes('session')) {
                window.location.href = '/login?expired=true';
            }
        } catch (e) {}
    }
    return response;
};

document.addEventListener('DOMContentLoaded', () => {
    if (new URLSearchParams(window.location.search).get('expired') === 'true') {
        window.showToast('Your session has expired. Please login again.', 'error');
    }
});
