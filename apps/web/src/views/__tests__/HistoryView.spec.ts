import { describe, it, expect, vi, beforeEach, afterEach, suite } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { ref, type Ref } from 'vue'

// Mock types
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

let mockExecute: ReturnType<typeof vi.fn>
let mockData: Ref<AnalysesResponse | null>
let mockError: Ref<Error | null>
let mockIsFetching: Ref<boolean>

vi.mock('../../composables/useApiFetch', () => ({
  useApiFetch: () => ({
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
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
  }),
}))

const HistoryView = await import('../HistoryView.vue').then((m) => m.default)

describe('HistoryView', () => {
  beforeEach(() => {
    mockExecute = vi.fn()
    mockData = ref(null)
    mockError = ref(null)
    mockIsFetching = ref(false)

    // Reset URL
    window.history.pushState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
  })

  suite('Loading State', () => {
    it('should display loading message when fetching', () => {
      mockIsFetching.value = true
      render(HistoryView)
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })

    it('should not display table when loading', () => {
      mockIsFetching.value = true
      render(HistoryView)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  suite('Data Display', () => {
    it('should display table with data when loaded', async () => {
      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
            results: {
              'test-rule': { passed: true, message: 'Passed' },
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      render(HistoryView)

      await waitFor(() => {
        expect(screen.getByText('https://example.com')).toBeInTheDocument()
        expect(screen.getByText('finished')).toBeInTheDocument()
      })
    })

    it('should display correct pass/fail count', async () => {
      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
            results: {
              'rule1': { passed: true, message: 'Passed' },
              'rule2': { passed: false, message: 'Failed' },
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      render(HistoryView)

      await waitFor(() => {
        expect(screen.getByText('1 / 2 passaram')).toBeInTheDocument()
      })
    })
  })

  suite('Pagination', () => {
    it('should update URL when changing page', async () => {
      const user = userEvent.setup()

      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 20,
        page: 1,
        limit: 10,
        totalPages: 2,
      }

      render(HistoryView)

      const nextButton = screen.getByRole('button', { name: /próxima/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(window.location.search).toContain('page=2')
      })
    })

    it('should disable previous button on first page', async () => {
      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 20,
        page: 1,
        limit: 10,
        totalPages: 2,
      }

      render(HistoryView)

      const prevButton = screen.getByRole('button', { name: /anterior/i })
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', async () => {
      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 20,
        page: 2,
        limit: 10,
        totalPages: 2,
      }

      window.history.pushState({}, '', '/?page=2')

      render(HistoryView)

      const nextButton = screen.getByRole('button', { name: /próxima/i })
      expect(nextButton).toBeDisabled()
    })
  })

  suite('Details Modal', () => {
    it('should open modal when clicking "Ver" button', async () => {
      const user = userEvent.setup()

      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
            results: {
              'test-rule': { passed: true, message: 'Passed' },
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      render(HistoryView)

      const viewButton = screen.getByRole('button', { name: /^Ver$/ })
      await user.click(viewButton)

      expect(screen.getByText('Detalhes da Análise')).toBeInTheDocument()

      const modalContent = screen.getByText('Detalhes da Análise').closest('.modal-content')
      expect(modalContent).toHaveTextContent('https://example.com')
    })

    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup()

      mockData.value = {
        items: [
          {
            _id: '1',
            url: 'https://example.com',
            status: 'finished',
            createdAt: new Date().toISOString(),
            results: {},
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      render(HistoryView)

      const viewButton = screen.getByRole('button', { name: /^Ver$/ })
      await user.click(viewButton)

      const closeButton = screen.getByRole('button', { name: /fechar detalhes/i })
      await user.click(closeButton)

      expect(screen.queryByText('Detalhes da Análise')).not.toBeInTheDocument()
    })
  })

  suite('Empty State', () => {
    it('should display empty message when no analyses found', async () => {
      mockData.value = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }

      render(HistoryView)

      await waitFor(() => {
        expect(screen.getByText('Nenhuma análise encontrada.')).toBeInTheDocument()
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
      })
    })
  })
})
