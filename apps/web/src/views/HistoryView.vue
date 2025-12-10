<script setup lang="ts">
import { useOffsetPagination, useUrlSearchParams, onKeyStroke } from '@vueuse/core'
import { useApiFetch } from '../composables/useApiFetch'
import { computed, watch, ref, nextTick } from 'vue'
import AnalysisResults from '../components/AnalysisResults.vue'

interface Analysis {
  _id: string
  url: string
  status: string
  createdAt: string
  results?: Record<string, { passed: boolean; message: string }>
}

interface AnalysesResponse {
  items: Analysis[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const params = useUrlSearchParams('history')
const page = ref(Number(params.page) || 1)
const limit = ref(Number(params.limit) || 10)

const total = ref(Number.MAX_SAFE_INTEGER)

const { currentPage, currentPageSize, isFirstPage, isLastPage, prev, next } = useOffsetPagination({
  total,
  page,
  pageSize: limit,
})
const url = computed(() => `/api/analyses?page=${currentPage.value}&limit=${currentPageSize.value}`)
const { data, isFetching } = useApiFetch(url, {
  immediate: true,
  refetch: true,
}).json<AnalysesResponse>()

const selectedAnalysis = ref<Analysis | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)

function selectAnalysis(analysis: Analysis) {
  lastFocusedElement.value = document.activeElement as HTMLElement
  selectedAnalysis.value = analysis
}

function closeAnalysis() {
  selectedAnalysis.value = null
  nextTick(() => {
    lastFocusedElement.value?.focus()
  })
}

watch(selectedAnalysis, async (val) => {
  if (val) {
    await nextTick()
    closeButtonRef.value?.focus()
  }
})

onKeyStroke('Escape', (e) => {
  if (selectedAnalysis.value) {
    e.preventDefault()
    closeAnalysis()
  }
})

watch(currentPage, (val) => {
  params.page = String(val)
})

watch(currentPageSize, (val) => {
  params.limit = String(val)
})

watch(data, (newData) => {
  if (newData) {
    total.value = newData.total
  }
})
</script>

<template>
  <div class="history-view">
    <h1>Histórico de Análises</h1>

    <div v-if="isFetching" role="status" aria-live="polite" class="loading">Carregando...</div>

    <div v-else-if="data" class="content">
      <div v-if="data.items.length === 0" class="empty-state">
        <p>Nenhuma análise encontrada.</p>
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>URL</th>
            <th>Status</th>
            <th>Data</th>
            <th>Resultados</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in data.items"
            :key="item._id"
            @click="selectAnalysis(item)"
            class="clickable-row"
            tabindex="0"
            @keydown.enter="selectAnalysis(item)"
            role="button"
            :aria-label="`Ver detalhes da análise de ${item.url}`"
          >
            <td>{{ item.url }}</td>
            <td>{{ item.status }}</td>
            <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
            <td>
              <span v-if="item.results">
                {{ Object.values(item.results).filter((r) => r.passed).length }}
                / {{ Object.keys(item.results).length }} passaram
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <button class="action-button" @click.stop="selectAnalysis(item)">
                Ver
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="data.items.length > 0">
        <button :disabled="isFirstPage" @click="prev" class="pagination-button">Anterior</button>
        <span>Página {{ currentPage }} de {{ data?.totalPages || 1 }}</span>
        <button
          :disabled="isLastPage || currentPage >= (data?.totalPages || 1)"
          @click="next"
          class="pagination-button"
        >
          Próxima
        </button>
      </div>
    </div>

    <div
      v-if="selectedAnalysis"
      class="modal-overlay"
      @click="closeAnalysis"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 id="modal-title">Detalhes da Análise</h2>
          <button
            ref="closeButtonRef"
            class="close-button"
            @click="closeAnalysis"
            aria-label="Fechar detalhes"
          >
            ×
          </button>
        </div>
        <p><strong>URL:</strong> {{ selectedAnalysis.url }}</p>
        <p>
          <strong>Data:</strong>
          {{ new Date(selectedAnalysis.createdAt).toLocaleString() }}
        </p>
        <AnalysisResults
          v-if="selectedAnalysis.results"
          :results="selectedAnalysis.results"
        />
        <p v-else>Sem resultados disponíveis.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th,
td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover,
.clickable-row:focus {
  background-color: #f0f7ff;
  outline: none;
}

.action-button {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  background-color: #1d4ed8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-button:hover {
  background-color: #1e40af;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  color: #1d4ed8;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.pagination-button:hover:not(:disabled) {
  background: #1d4ed8;
  color: white;
}

.pagination-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #ccc;
  color: #ccc;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: #666;
  border-radius: 4px;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.close-button:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
  background-color: #eff6ff;
  color: #1d4ed8;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}
</style>
