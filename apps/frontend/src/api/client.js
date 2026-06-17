import axios from "axios";
import logger from "../utils/logger";

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
const addTokenInterceptor = (config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const errorInterceptor = (error) => {
  return Promise.reject(error);
};

catalogApi.interceptors.request.use(addTokenInterceptor, errorInterceptor);
userApi.interceptors.request.use(addTokenInterceptor, errorInterceptor);

// Add Response Interceptors for Logging (Professor's Requirement)
const responseLogger = (response) => {
  logger.info(`Response from ${response.config.url}:`, response.data);
  return response;
};

const responseErrorLogger = (error) => {
  logger.error(`API Error on ${error.config?.url}:`, error.response?.data || error.message);
  return Promise.reject(error);
};

authApi.interceptors.response.use(responseLogger, responseErrorLogger);
catalogApi.interceptors.response.use(responseLogger, responseErrorLogger);
userApi.interceptors.response.use(responseLogger, responseErrorLogger);

