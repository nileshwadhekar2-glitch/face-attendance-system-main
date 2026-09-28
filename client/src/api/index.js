const BASE_URL = '/api';

// Helper function to handle authorized fetch requests
const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('adminToken');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers, credentials: 'include' });

    // Global catch for unauthorized/forbidden responses
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        window.location.href = '/admin-login';
    }

    return response;
};

export const api = {
    admin: {
        login: async (credentials) => {
            const res = await fetch(`${BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                credentials: 'include'
            });
            return res.json();
        }
    },
    users: {
        getAll: async (search = '') => {
            const res = await apiFetch(`${BASE_URL}/users${search ? `?search=${search}` : ''}`);
            return res.json();
        },
        register: async (userData) => {
            const isFormData = userData instanceof FormData;
            const res = await fetch(`${BASE_URL}/users/register`, {
                method: 'POST',
                headers: isFormData ? {} : { 'Content-Type': 'application/json' },
                body: isFormData ? userData : JSON.stringify(userData)
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    return { success: false, error: json.error || res.statusText };
                } catch (e) {
                    return { success: false, error: `Server Error (${res.status}): ${text.substring(0, 100)}` };
                }
            }
            return res.json();
        },
        delete: async (id) => {
            const res = await apiFetch(`${BASE_URL}/users/${id}`, { method: 'DELETE' });
            return res.json();
        }
    },
    classes: {
        getAll: async () => {
            const res = await fetch(`${BASE_URL}/classes`); // Keeping GET classes public for registration
            return res.json();
        },
        create: async (data) => {
            const res = await apiFetch(`${BASE_URL}/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return res.json();
        },
        delete: async (id) => {
            const res = await apiFetch(`${BASE_URL}/classes/${id}`, { method: 'DELETE' });
            return res.json();
        }
    },
    sessions: {
        getActive: async () => {
            const res = await fetch(`${BASE_URL}/sessions/active`); // Keeping GET active public for attendance
            return res.json();
        },
        getHistory: async () => {
            const res = await apiFetch(`${BASE_URL}/sessions/history`);
            return res.json();
        },
        create: async (name, type, duration = 0, classId = null) => {
            const res = await apiFetch(`${BASE_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', name, type, duration, class_id: classId })
            });
            return res.json();
        },
        toggleActive: async (id, isActive) => {
            const res = await apiFetch(`${BASE_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle', id, isActive })
            });
            return res.json();
        },
        toggleType: async (id) => {
            const res = await apiFetch(`${BASE_URL}/sessions/${id}/type`, { method: 'PUT' });
            return res.json();
        },
        getStats: async (id) => {
            const res = await apiFetch(`${BASE_URL}/sessions/${id}/stats`);
            return res.json();
        },
        delete: async (id) => {
            const res = await apiFetch(`${BASE_URL}/sessions/${id}`, { method: 'DELETE' });
            return res.json();
        }
    },
    attendance: {
        getLogs: async (search = '', sessionId = '', filterDate = '') => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (sessionId) params.append('sessionId', sessionId);
            if (filterDate) params.append('date', filterDate);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await apiFetch(`${BASE_URL}/attendance${qs}`);
            return res.json();
        },
        log: async (userId, image) => {
            // Support FormData for image upload
            if (userId instanceof FormData) {
                const res = await fetch(`${BASE_URL}/attendance`, {
                    method: 'POST',
                    body: userId // In this case, first arg is FormData
                });
                return res.json();
            }

            const res = await fetch(`${BASE_URL}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, image })
            });
            return res.json();
        },
        delete: async (id) => {
            const res = await apiFetch(`${BASE_URL}/attendance/${id}`, { method: 'DELETE' });
            return res.json();
        },
        deleteBulk: async (date) => {
            const res = await apiFetch(`${BASE_URL}/attendance/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            return res.json();
        },
        exportUrl: `${BASE_URL}/attendance/export`,
        exportMatrixUrl: (identifier, isClass = false) => {
            const param = isClass ? `classId=${identifier}` : `sessionName=${encodeURIComponent(identifier)}`;
            return `${BASE_URL}/attendance/export-matrix?${param}`;
        },
        downloadExportBlob: async (url, filename) => {
            const token = localStorage.getItem('adminToken');

            console.log(`[Export] Fetching ${url} with token:`, !!token);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(`[Export] Response status:`, res.status);

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    window.location.href = '/admin-login';
                }
                throw new Error('Failed to download file');
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        }
    }
};
