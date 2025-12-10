<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useWebSocket } from '@vueuse/core'
import { useApiFetch } from '../composables/useApiFetch'
import AnalysisResults from '../components/AnalysisResults.vue'
import type { RuleResult } from '@wcag-analyser/shared'

interface AnalysisResult {
  id: string
  url: string
  status: string
  results?: Record<string, RuleResult<any>>
}

const payload = reactive({
  url: '',
})
const validationError = ref<string | null>(null)
const currentAnalysisId = ref<string | null>(null)
const analysisStatus = ref<string | null>(null)
const results = ref<Record<string, RuleResult<any>> | null>(null)



const { data: wsData } = useWebSocket(import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000', {
  autoReconnect: true,
})

const {
  data: analysisResult,
  error,
  isFetching: loading,
  execute,
} = useApiFetch('/api/analyze', {
  immediate: false,
})
  .post(payload)
  .json<AnalysisResult>()

watch(analysisResult, (newVal) => {
  if (newVal) {
    currentAnalysisId.value = newVal.id
    analysisStatus.value = newVal.status
    if (newVal.results) {
      results.value = newVal.results
    }
  }
})

watch(wsData, (newValue) => {
  if (!newValue || !currentAnalysisId.value) return
  try {
    const message = JSON.parse(newValue)
    if (
      message.event === 'analysis-progress' &&
      message.data.analysisId === currentAnalysisId.value
    ) {
      analysisStatus.value = message.data.status
      if (message.data.results) {
        results.value = message.data.results
      }
      if (message.data.errorMessage) {
        // TODO: handle error message
      }
    }
  } catch (e) {
    console.error('Error parsing WS message', e)
  }
})

const isProcessing = computed(() => {
  return !!(
    analysisStatus.value &&
    analysisStatus.value !== 'finished' &&
    analysisStatus.value !== 'failed'
  )
})

const finalResults = computed(() => {
  return results.value
})

const statusMessage = computed(() => {
  switch (analysisStatus.value) {
    case 'pending':
      return 'Aguardando início...'
    case 'fetching':
      return 'Baixando conteúdo da página...'
    case 'ongoing':
      return 'Verificando regras de acessibilidade...'
    case 'finished':
      return 'Análise concluída!'
    case 'failed':
      return 'Falha na análise.'
    default:
      return ''
  }
})

const errorMessage = computed(() => {
  if (error.value) {
    return 'Erro ao iniciar a análise. Verifique se a API está rodando.'
  }
  if (analysisStatus.value === 'failed') {
    return 'Ocorreu um erro durante a análise da URL.'
  }
  return null
})

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function analyzeUrl() {
  validationError.value = null

  if (!payload.url.trim()) {
    validationError.value = 'Por favor, insira uma URL'
    return
  }

  if (!isValidUrl(payload.url)) {
    validationError.value = 'Por favor, insira uma URL válida (ex: https://www.example.com)'
    return
  }

  currentAnalysisId.value = null
  analysisStatus.value = null
  results.value = null

  execute()
}
</script>

<template>
  <div class="analyser-container">
    <div class="card">
      <h1 class="title">WCAG Analyser</h1>

      <div class="form-section">
        <label for="url-input" class="label">Insira uma URL para análise</label>
        <input
          id="url-input"
          v-model="payload.url"
          type="url"
          class="input"
          placeholder="https://www.example.com"
          @keyup.enter="analyzeUrl"
          :disabled="loading || isProcessing"
        />
        <button
          class="button"
          @click="analyzeUrl"
          :disabled="loading || isProcessing || !payload.url.trim()"
        >
          {{ loading || isProcessing ? 'Analisando...' : 'Analisar →' }}
        </button>
      </div>

      <div v-if="isProcessing" class="status-message">
        <span class="spinner">⏳</span> {{ statusMessage }}
      </div>

      <div v-if="validationError" class="validation-message">
        {{ validationError }}
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <AnalysisResults v-if="finalResults" :results="finalResults" />

      <RouterLink to="/history" class="button-secondary">Ver análises anteriores</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.analyser-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: white;
  border: 2px solid #1d4ed8;
  border-radius: 12px;
  padding: 3rem;
  max-width: 680px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2.5rem;
  color: #1d4ed8;
  text-align: center;
  margin: 0;
  font-weight: 400;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 1rem;
  color: #1d4ed8;
  margin: 0;
}

.input {
  padding: 1rem;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input::placeholder {
  color: #666;
}

.input:focus {
  border-color: #1e40af;
}

.input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.button {
  padding: 1rem 2rem;
  background: white;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  color: #1d4ed8;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.button:hover:not(:disabled) {
  background: #1d4ed8;
  color: white;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.result-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
}

.result-text {
  margin: 0;
  color: #1d4ed8;
  font-size: 0.95rem;
  line-height: 1.5;
}

.status-ok {
  color: #4caf50;
  font-weight: bold;
}

.status-warning {
  color: #ff9800;
  font-weight: bold;
}

.validation-message {
  padding: 1rem;
  background-color: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 8px;
  color: #e65100;
  font-size: 0.95rem;
}

.error-message {
  padding: 1rem;
  background-color: #ffebee;
  border: 1px solid #f44336;
  border-radius: 8px;
  color: #c62828;
  font-size: 0.95rem;
}

.button-secondary {
  padding: 1rem 2rem;
  background: white;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  color: #1d4ed8;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.button-secondary:hover {
  background: #1d4ed8;
  color: white;
}

.status-message {
  padding: 1rem;
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  color: #0d47a1;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  animation: spin 2s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
