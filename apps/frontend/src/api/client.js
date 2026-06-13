import axios from "axios";

// Exclusive client for the Auth Service
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
});

// Exclusive client for the Catalog Service
export const catalogApi = axios.create({
  baseURL: import.meta.env.VITE_CATALOG_API_URL,
});

// Exclusive client for the User Service
export const userApi = axios.create({
  baseURL: import.meta.env.VITE_USER_API_URL,
});

// Interceptor to automatically inject the JWT token into protected routes
catalogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
