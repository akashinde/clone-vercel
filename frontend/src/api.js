import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000',
})

API.interceptors.response.use(function (response) {
    if (response.data) return response.data;
    return response;
}, function (error) {
    return Promise.reject(error);
})

export default API;