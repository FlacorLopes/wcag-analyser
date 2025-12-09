<script setup lang="ts">
import { useOffsetPagination, useUrlSearchParams } from '@vueuse/core'
import { useApiFetch } from '../composables/useApiFetch'
import { computed, watch, ref } from 'vue'

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
const url = computed(() => `analyses?page=${currentPage.value}&limit=${currentPageSize.value}`)
const { data, isFetching } = useApiFetch(url, {
  immediate: true,
  refetch: true,
}).json<AnalysesResponse>()

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

    <div v-if="isFetching" class="loading">Carregando...</div>

    <div v-else-if="data" class="content">
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Status</th>
            <th>Data</th>
            <th>Resultados</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data.items" :key="item._id">
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
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="isFirstPage" @click="prev">Anterior</button>
        <span>Página {{ currentPage }} de {{ data?.totalPages || 1 }}</span>
        <button :disabled="isLastPage || currentPage >= (data?.totalPages || 1)" @click="next">
          Próxima
        </button>
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

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
}

button {
  padding: 0.5rem 1rem;
}
</style>
