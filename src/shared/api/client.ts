import axios from 'axios'

// VITE_API_URL apunta a json-server en desarrollo (http://localhost:3001)
// y al backend real de Render una vez conectado (Sprint 2).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})
