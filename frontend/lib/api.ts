import { useAuthStore } from "@/store/authStore"
import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:5000/api"
})

api.interceptors.request.use(config => {
    const token = useAuthStore.getState().token

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
}, (error) => {
    return Promise.reject(error)
})

export default api