import axios from "axios";
import { API_BASE_URL, ENDPOINTS } from "./endpoints";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Refresh Token Logic ──
// Tracks whether a refresh is already in progress to prevent
// multiple concurrent refresh requests (race condition).
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const forceLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
};

// Response Interceptor: Attempt token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only try refresh on 401 and not already retried
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Don't try to refresh if the failing request IS the refresh call
        if (originalRequest.url === ENDPOINTS.REFRESH) {
            forceLogout();
            return Promise.reject(error);
        }

        // If a refresh is already in progress, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            isRefreshing = false;
            forceLogout();
            return Promise.reject(error);
        }

        try {
            const { data } = await axios.post(
                `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
                { refresh: refreshToken }
            );

            const newAccessToken = data.access;
            localStorage.setItem("access_token", newAccessToken);

            // If the server also rotates the refresh token
            if (data.refresh) {
                localStorage.setItem("refresh_token", data.refresh);
            }

            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            forceLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
