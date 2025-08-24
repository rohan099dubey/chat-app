import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const axiosInstance = axios.create(
    {
        // baseURL: "http://10.1.5.67:3000/api",
        // baseURL: "http://localhost:3000/api",
        baseURL: `${API_URL}/api`,
        withCredentials: true,
    });
