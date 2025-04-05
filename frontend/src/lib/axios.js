import axios from 'axios';

export const axiosInstance = axios.create(
    {
        // baseURL: "http://10.1.5.67:3000/api",
        baseURL: "http://localhost:3000/api",
        withCredentials: true,
    });
