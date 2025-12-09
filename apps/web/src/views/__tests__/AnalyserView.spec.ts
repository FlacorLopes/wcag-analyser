import { it, expect, vi, beforeEach, afterEach, suite, describe } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { ref, type Ref } from 'vue'

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

let mockExecute: ReturnType<typeof vi.fn>
let mockData: Ref<AnalysisResult | null>
let mockError: Ref<Error | null>
let mockIsFetching: Ref<boolean>

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

      expect(
        screen.getByText(/por favor, insira uma url/i),
      ).toBeInTheDocument()
      expect(mockExecute).not.toHaveBeenCalled()
    })

    it('should display error when URL is invalid', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'url-invalida')
      await user.click(button)

      expect(
        screen.getByText(/por favor, insira uma url válida/i),
      ).toBeInTheDocument()
      expect(mockExecute).not.toHaveBeenCalled()
    })

    it('should not display validation error when URL is valid', async () => {
      const user = userEvent.setup()
      render(AnalyserView)

      const input = screen.getByLabelText(/insira uma url para análise/i)
      const button = screen.getByRole('button', { name: /analisar/i })

      await user.type(input, 'https://example.com')
      await user.click(button)

      expect(
        screen.queryByText(/por favor, insira uma url/i),
      ).not.toBeInTheDocument()
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
        expect(
          screen.getByText(/erro ao analisar a url/i),
        ).toBeInTheDocument()
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
})
