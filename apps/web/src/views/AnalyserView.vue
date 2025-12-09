<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useApiFetch } from '../composables/useApiFetch'

interface RuleResult {
  passed: boolean
  message: string
  details?: string[]
}

interface AnalysisResult {
  url: string
  status: string
  results: Record<string, RuleResult>
}

const payload = reactive({
  url: '',
})
const validationError = ref<string | null>(null)
const {
  data: analysisResult,
  error,
  isFetching: loading,
  execute,
} = useApiFetch('analyze', {
  immediate: false,
})
  .post(payload)
  .json<AnalysisResult>()

const errorMessage = computed(() => {
  if (error.value) {
    return 'Erro ao analisar a URL. Verifique se a API está rodando.'
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

  execute()
}

function getRuleIcon(passed: boolean) {
  return passed ? '✅' : '⚠️'
}

function getRuleLabel(ruleKey: string) {
  const labels: Record<string, string> = {
    'title-check': 'tag <title>',
    'img-alt-check': 'atributo alt em imagens',
    'input-label-check': 'associação de labels com inputs',
  }
  return labels[ruleKey] || ruleKey
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
          :disabled="loading"
        />
        <button class="button" @click="analyzeUrl" :disabled="loading || !payload.url.trim()">
          {{ loading ? 'Analisando...' : 'Analisar →' }}
        </button>
      </div>

      <div v-if="validationError" class="validation-message">
        {{ validationError }}
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="analysisResult" class="results-section">
        <div v-for="(result, key) in analysisResult.results" :key="key" class="result-item">
          <span class="result-icon">{{ getRuleIcon(result.passed) }}</span>
          <div class="result-content">
            <p class="result-text">
              {{ getRuleLabel(key as string) }} existe e não está vazio.
              <span :class="result.passed ? 'status-ok' : 'status-warning'">
                {{ result.passed ? '✓' : '⚠' }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <button class="button-secondary">Ver análises anteriores</button>
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
  border: 2px solid #4a90e2;
  border-radius: 12px;
  padding: 3rem;
  max-width: 680px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2.5rem;
  color: #4a90e2;
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
  color: #4a90e2;
  margin: 0;
}

.input {
  padding: 1rem;
  border: 1px solid #4a90e2;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.input::placeholder {
  color: #ccc;
}

.input:focus {
  border-color: #357abd;
}

.input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.button {
  padding: 1rem 2rem;
  background: white;
  border: 1px solid #4a90e2;
  border-radius: 8px;
  color: #4a90e2;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.button:hover:not(:disabled) {
  background: #4a90e2;
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
  border: 1px solid #4a90e2;
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
  color: #4a90e2;
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
  border: 1px solid #4a90e2;
  border-radius: 8px;
  color: #4a90e2;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.button-secondary:hover {
  background: #4a90e2;
  color: white;
}
</style>
