<script setup lang="ts">
import type {
  RuleResult,
  ImgAltRuleDetails,
  InputLabelRuleDetails,
  TitleRuleDetails,
} from '@wcag-analyser/shared'

defineProps<{
  results: Record<string, RuleResult<unknown>>
}>()

function getRuleIcon(passed: boolean) {
  return passed ? '✅' : '⚠️'
}

function getRuleLabel(ruleKey: string) {
  const labels: Record<string, string> = {
    'title-check': 'Tag <title>',
    'img-alt-check': 'Atributo alt em imagens',
    'input-label-check': 'Associação de labels com inputs',
  }
  return labels[ruleKey] || ruleKey
}
</script>

<template>
  <div class="results-section" data-testid="results-section">
    <div v-for="(result, key) in results" :key="key" class="result-item">
      <span class="result-icon">{{ getRuleIcon(result.passed) }}</span>
      <div class="result-content">
        <p class="result-header">
          <strong>{{ getRuleLabel(key as string) }}</strong>
          <span :class="result.passed ? 'status-ok' : 'status-warning'">
            {{ result.passed ? 'Passou' : 'Falhou' }}
          </span>
        </p>
        <p class="result-message">{{ result.message }}</p>

        <!-- Details for Title -->
        <div v-if="key === 'title-check' && result.details" class="details-box">
          <p v-if="(result.details as TitleRuleDetails).title">
            Conteúdo encontrado:
            <code>{{ (result.details as TitleRuleDetails).title }}</code>
          </p>
          <p v-else>Nenhum título encontrado.</p>
        </div>

        <!-- Details for Images -->
        <div v-if="key === 'img-alt-check' && result.details" class="details-box">
          <p>
            Total de imagens:
            {{ (result.details as ImgAltRuleDetails).totalImages }}
          </p>
          <p>
            Sem atributo alt:
            {{ (result.details as ImgAltRuleDetails).imagesWithoutAlt }}
          </p>
          <p>
            Com alt vazio:
            {{ (result.details as ImgAltRuleDetails).imagesWithEmptyAlt }}
          </p>
        </div>

        <!-- Details for Inputs -->
        <div v-if="key === 'input-label-check' && result.details" class="details-box">
          <p>
            Total de inputs:
            {{ (result.details as InputLabelRuleDetails).totalInputs }}
          </p>
          <p>
            Sem label associado:
            {{ (result.details as InputLabelRuleDetails).inputsWithoutLabel }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.result-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-header {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-message {
  margin: 0 0 0.75rem 0;
  color: #666;
}

.status-ok {
  color: #2e7d32;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background: #e8f5e9;
  border-radius: 4px;
}

.status-warning {
  color: #ed6c02;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background: #fff3e0;
  border-radius: 4px;
}

.details-box {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.9rem;
}

.details-box p {
  margin: 0.25rem 0;
}

.details-box ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.details-box code {
  background: #e0e0e0;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
}
</style>
