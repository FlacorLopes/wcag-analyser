import { test, expect } from '@playwright/test'

const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000'

test.describe('WCAG Analyser E2E', () => {
  test('should analyze accessible page and show success results', async ({ page }) => {

    await page.goto('/')

    const targetUrl = `${API_URL}/test-fixtures/accessible.html`
    await page.getByPlaceholder('https://www.example.com').fill(targetUrl)
    await page.getByRole('button', { name: 'Analisar' }).click()

    await expect(page.getByTestId('results-section')).toBeVisible({ timeout: 30000 })

    await expect(page.getByText('Todas as imagens possuem atributo alt')).toBeVisible()
    await expect(page.getByText('Todos os inputs possuem labels associados')).toBeVisible()
    await expect(page.getByText('Título existe e não está vazio')).toBeVisible()
  })

  test('should analyze not accessible page and show issues', async ({ page }) => {
    await page.goto('/')

    const targetUrl = `${API_URL}/test-fixtures/not-accessible.html`
    await page.getByPlaceholder('https://www.example.com').fill(targetUrl)
    await page.getByRole('button', { name: 'Analisar' }).click()

    await expect(page.getByTestId('results-section')).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/imagens não possuem ou têm atributo alt vazio/)).toBeVisible()
    await expect(page.getByText(/inputs não possuem associação explícita de label/)).toBeVisible()
    await expect(page.getByText('Título ausente ou vazio')).toBeVisible()
  })

  test('should view analysis details in history', async ({ page, request }) => {
    const targetUrl = `${API_URL}/test-fixtures/accessible.html`
    const response = await request.post(`${API_URL}/api/analyze`, {
      data: { url: targetUrl },
    })
    expect(response.ok()).toBeTruthy()
    const analysis = await response.json()

    await expect
      .poll(
        async () => {
          const res = await request.get(`${API_URL}/api/analyses?limit=10`)
          const data = await res.json()
          const item = data.items.find((i: any) => i._id === analysis.id)
          return item?.status
        },
        {
          timeout: 10000,
        },
      )
      .toBe('finished')

    await page.goto('/history')

    await expect(page.getByText('Carregando...')).not.toBeVisible()
    const row = page.getByRole('button').filter({ hasText: targetUrl }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Ver' }).click()
    const modal = page.locator('.modal-content')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText(targetUrl)
    await expect(modal).toContainText('Todas as imagens possuem atributo alt')
  })
})
