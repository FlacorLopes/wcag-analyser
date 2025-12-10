import { it, expect, vi, beforeEach, afterEach, suite, describe } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { ref, type Ref } from 'vue'

interface RuleResult {
  passed: boolean
  message: string
  details?: any
}

interface AnalysisResult {
  url: string
  status: string
  results: Record<string, RuleResult>
}

let mockExecute: ReturnType<typeof vi.fn>
let mockData: Ref<AnalysisResult | null>
let mockError: Ref<Error | null>
let mockIsFetching: Ref<boolean>
const mockWsData = ref<string | null>(null)

vi.mock('../../composables/useApiFetch', () => ({
  useApiFetch: () => ({
    post: () => ({
      json: () => ({
        get data() {
          return mockData
        },
        get error() {
          return mockError
        },
        get isFetching() {
          return mockIsFetching
        },
        get execute() {
          return mockExecute
        },
      }),
    }),
  }),
}))

vi.mock('@vueuse/core', () => ({
  useWebSocket: vi.fn(() => ({
    data: mockWsData,
    close: vi.fn(),
    send: vi.fn(),
    open: vi.fn(),
    status: ref('OPEN'),
  })),
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

const AnalyserView = await import('../AnalyserView.vue').then((m) => m.default)

describe('AnalyserView', () => {
  beforeEach(() => {
    mockExecute = vi.fn()
    mockData = ref(null)
    mockError = ref(null)
    mockIsFetching = ref(false)
    mockWsData.value = null
  })

  afterEach(() => {
    cleanup()
  })

  suite('Initial State', () => {
    it('should render with empty input and disabled button', () => {
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      expect(input).toHaveValue('')
      expect(button).toBeDisabled()
    })

    it('should not display error messages or results', () => {
      render(AnalyserView)

      expect(screen.queryByText(/erro/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/tag <title>/i)).not.toBeInTheDocument()
    })
  })

  suite('Validation', () => {
    it('should enable button when URL is filled', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')

      expect(button).not.toBeDisabled()
    })

    it('should display error when submitting empty field', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)

      await user.type(input, '{Enter}')

      expect(screen.getByText(/por favor, insira uma url/i)).toBeInTheDocument()
      expect(mockExecute).not.toHaveBeenCalled()
    })

    it('should display error when URL is invalid', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'url-invalida')
      await user.click(button)

      expect(screen.getByText(/por favor, insira uma url válida/i)).toBeInTheDocument()
      expect(mockExecute).not.toHaveBeenCalled()
    })

    it('should not display validation error when URL is valid', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      expect(screen.queryByText(/por favor, insira uma url/i)).not.toBeInTheDocument()
      expect(mockExecute).toHaveBeenCalledTimes(1)
    })

    it('should submit when pressing Enter in input', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)

      await user.type(input, 'https://example.com{Enter}')

      expect(mockExecute).toHaveBeenCalledTimes(1)
    })
  })

  suite('Submission', () => {
    it('should disable button and input during loading', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')

      mockIsFetching.value = true
      await user.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
        expect(input).toBeDisabled()
      })
    })

    it('should change button text to "Analisando..." during loading', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)

      await user.type(input, 'https://example.com')

      mockIsFetching.value = true

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /analisando/i })).toBeInTheDocument()
      })
    })
  })

  suite('Results', () => {
    it('should display results when request succeeds', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'title-check': {
            passed: true,
            message: 'Title tag exists',
          },
          'img-alt-check': {
            passed: false,
            message: 'Missing alt attributes',
          },
        },
      }

      await waitFor(() => {
        expect(screen.getByText(/tag <title>/i)).toBeInTheDocument()
        expect(screen.getByText(/atributo alt em imagens/i)).toBeInTheDocument()
      })
    })

    it('should display ✅ icon for passed rules', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'title-check': {
            passed: true,
            message: 'Title tag exists',
          },
        },
      }

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument()
      })
    })

    it('should display ⚠️ icon for failed rules', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'img-alt-check': {
            passed: false,
            message: 'Missing alt attributes',
          },
        },
      }

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument()
      })
    })

    it('should display correct rule labels', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'title-check': {
            passed: true,
            message: 'Title exists',
          },
          'img-alt-check': {
            passed: false,
            message: 'Missing alt',
          },
          'input-label-check': {
            passed: true,
            message: 'Labels ok',
          },
        },
      }

      await waitFor(() => {
        expect(screen.getByText(/tag <title>/i)).toBeInTheDocument()
        expect(screen.getByText(/atributo alt em imagens/i)).toBeInTheDocument()
        expect(screen.getByText(/associação de labels com inputs/i)).toBeInTheDocument()
      })
    })
  })

  suite('Error', () => {
    it('should display error message when request fails', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockError.value = new Error('Network error')

      await waitFor(() => {
        expect(screen.getByText(/erro ao iniciar a análise/i)).toBeInTheDocument()
      })
    })

    it('should not display results when there is an error', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockError.value = new Error('Network error')

      await waitFor(() => {
        expect(screen.queryByText(/tag <title>/i)).not.toBeInTheDocument()
      })
    })
  })

  suite('WebSocket Updates', () => {
    it('should update status message when receiving progress via WebSocket', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      // Simulate API response setting the ID
      mockData.value = {
        url: 'https://example.com',
        status: 'pending',
        results: {},
        id: '123',
      } as any

      await waitFor(() => {
        expect(screen.getByText(/aguardando início/i)).toBeInTheDocument()
      })

      // Simulate WS message
      mockWsData.value = JSON.stringify({
        event: 'analysis-progress',
        data: {
          analysisId: '123',
          status: 'fetching',
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/baixando conteúdo da página/i)).toBeInTheDocument()
      })

      mockWsData.value = JSON.stringify({
        event: 'analysis-progress',
        data: {
          analysisId: '123',
          status: 'ongoing',
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/verificando regras de acessibilidade/i)).toBeInTheDocument()
      })
    })

    it('should update results when receiving finished status via WebSocket', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'pending',
        results: {},
        id: '123',
      } as any

      mockWsData.value = JSON.stringify({
        event: 'analysis-progress',
        data: {
          analysisId: '123',
          status: 'finished',
          results: {
            'title-check': {
              passed: true,
              message: 'Título existe e não está vazio',
            },
          },
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/tag <title>/i)).toBeInTheDocument()
      })
    })

    it('should ignore WebSocket messages for different analysis IDs', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'pending',
        results: {},
        id: '123',
      } as any

      mockWsData.value = JSON.stringify({
        event: 'analysis-progress',
        data: {
          analysisId: '999',
          status: 'finished',
        },
      })

      await waitFor(() => {
        expect(screen.queryByText(/análise concluída/i)).not.toBeInTheDocument()
        expect(screen.getByText(/aguardando início/i)).toBeInTheDocument()
      })
    })
  })

  suite('State Management', () => {
    it('should reset previous results when starting a new analysis', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      // First analysis
      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'title-check': { passed: true, message: 'OK' },
        },
        id: '123',
      } as any

      await waitFor(() => {
        expect(screen.getByText(/tag <title>/i)).toBeInTheDocument()
      })

      // Start second analysis
      await user.clear(input)
      await user.type(input, 'https://google.com')
      await user.click(button)

      expect(screen.queryByText(/tag <title>/i)).not.toBeInTheDocument()
    })
  })

  suite('Result Details', () => {
    it('should display title details', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'title-check': {
            passed: true,
            message: 'Title found',
            details: { title: 'Example Domain' },
          },
        },
        id: '123',
      } as any

      await waitFor(() => {
        expect(screen.getByText(/conteúdo encontrado/i)).toBeInTheDocument()
        expect(screen.getByText('Example Domain')).toBeInTheDocument()
      })
    })

    it('should display image details', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'img-alt-check': {
            passed: false,
            message: 'Issues found',
            details: {
              totalImages: 10,
              imagesWithoutAlt: 2,
              imagesWithEmptyAlt: 1,
            },
          },
        },
        id: '123',
      } as any

      await waitFor(() => {
        expect(screen.getByText(/total de imagens:\s*10/i)).toBeInTheDocument()
        expect(screen.getByText(/sem atributo alt:\s*2/i)).toBeInTheDocument()
      })
    })

    it('should display input details', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      mockData.value = {
        url: 'https://example.com',
        status: 'finished',
        results: {
          'input-label-check': {
            passed: false,
            message: '3 de 5 inputs não possuem associação explícita de label',
            details: {
              totalInputs: 5,
              inputsWithoutLabel: 3,
            },
          },
        },
        id: '123',
      } as any

      await waitFor(() => {
        expect(screen.getByText(/total de inputs:\s*5/i)).toBeInTheDocument()
        expect(screen.getByText(/sem label associado:\s*3/i)).toBeInTheDocument()
      })
    })
  })
})
