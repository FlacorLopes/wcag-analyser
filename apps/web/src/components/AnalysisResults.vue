<script setup lang="ts">
interface RuleResult {
  passed: boolean
  message: string
  details?: string[]
}

defineProps<{
  results: Record<string, RuleResult>
}>()

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
  <div class="results-section">
    <div v-for="(result, key) in results" :key="key" class="result-item">
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
</template>

<style scoped>
.results-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #4a90e2;
  border-radius: 8px;
  background-color: white;
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
</style>
