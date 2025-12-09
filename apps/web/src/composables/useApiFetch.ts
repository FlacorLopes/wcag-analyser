import { createFetch } from '@vueuse/core'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/'

export const useApiFetch = createFetch({
  baseUrl: API_BASE_URL,
  options: {
    timeout: 30000,
  },
  fetchOptions: {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
  },
})
