import { createFetch } from '@vueuse/core'

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

export const useApiFetch = createFetch({
  baseUrl: getApiBaseUrl(),
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
