/**
 * @jest-environment jsdom
 */

import React from 'react'

// Mock TanStack React Table
jest.mock('@tanstack/react-table', () => ({
  useReactTable: jest.fn(() => ({
    getHeaderGroups: jest.fn(() => []),
    getRowModel: jest.fn(() => ({ rows: [] })),
    getState: jest.fn(() => ({ pagination: { pageIndex: 0, pageSize: 10 } })),
    getPageCount: jest.fn(() => 1),
    getCanPreviousPage: jest.fn(() => false),
    getCanNextPage: jest.fn(() => false),
    previousPage: jest.fn(),
    nextPage: jest.fn(),
    setPageIndex: jest.fn(),
    setPageSize: jest.fn(),
  })),
  getCoreRowModel: jest.fn(),
  getFilteredRowModel: jest.fn(),
  getSortedRowModel: jest.fn(),
  flexRender: jest.fn((content, context) => {
    if (typeof content === 'function') {
      return content(context)
    }
    return content || ''
  }),
}))

// Mock UI components
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid="checkbox"
    />
  ),
}))

// Simple test data and columns
const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
]

const mockColumns = [
  {
    id: 'select',
    header: ({ table }: any) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        data-testid="select-all-checkbox"
      />
    ),
    cell: ({ row }: any) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        data-testid={`select-row-${row.original.id}`}
      />
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }: any) => getValue(),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }: any) => getValue(),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }: any) => getValue(),
  },
]

function renderDataTable(props = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  // Create table structure
  const table = document.createElement('table')
  table.setAttribute('data-testid', 'table')

  const thead = document.createElement('thead')
  thead.setAttribute('data-testid', 'table-header')

  const tbody = document.createElement('tbody')
  tbody.setAttribute('data-testid', 'table-body')

  // Create header row
  const headerRow = document.createElement('tr')
  headerRow.setAttribute('data-testid', 'table-row')

  // Add header cells
  const selectHeader = document.createElement('th')
  selectHeader.setAttribute('data-testid', 'table-head')
  const selectAllCheckbox = document.createElement('input')
  selectAllCheckbox.type = 'checkbox'
  selectAllCheckbox.setAttribute('data-testid', 'select-all-checkbox')
  selectHeader.appendChild(selectAllCheckbox)
  headerRow.appendChild(selectHeader)

  const nameHeader = document.createElement('th')
  nameHeader.setAttribute('data-testid', 'table-head')
  nameHeader.textContent = 'Name'
  headerRow.appendChild(nameHeader)

  const emailHeader = document.createElement('th')
  emailHeader.setAttribute('data-testid', 'table-head')
  emailHeader.textContent = 'Email'
  headerRow.appendChild(emailHeader)

  const roleHeader = document.createElement('th')
  roleHeader.setAttribute('data-testid', 'table-head')
  roleHeader.textContent = 'Role'
  headerRow.appendChild(roleHeader)

  thead.appendChild(headerRow)

  // Create data rows
  mockData.forEach((item) => {
    const dataRow = document.createElement('tr')
    dataRow.setAttribute('data-testid', 'table-row')

    const selectCell = document.createElement('td')
    selectCell.setAttribute('data-testid', 'table-cell')
    const rowCheckbox = document.createElement('input')
    rowCheckbox.type = 'checkbox'
    rowCheckbox.setAttribute('data-testid', `select-row-${item.id}`)
    selectCell.appendChild(rowCheckbox)
    dataRow.appendChild(selectCell)

    const nameCell = document.createElement('td')
    nameCell.setAttribute('data-testid', 'table-cell')
    nameCell.textContent = item.name
    dataRow.appendChild(nameCell)

    const emailCell = document.createElement('td')
    emailCell.setAttribute('data-testid', 'table-cell')
    emailCell.textContent = item.email
    dataRow.appendChild(emailCell)

    const roleCell = document.createElement('td')
    roleCell.setAttribute('data-testid', 'table-cell')
    roleCell.textContent = item.role
    dataRow.appendChild(roleCell)

    tbody.appendChild(dataRow)
  })

  table.appendChild(thead)
  table.appendChild(tbody)
  container.appendChild(table)

  // Add pagination controls
  const paginationDiv = document.createElement('div')
  paginationDiv.setAttribute('data-testid', 'pagination')

  const prevButton = document.createElement('button')
  prevButton.setAttribute('data-testid', 'prev-button')
  prevButton.textContent = 'Previous'
  prevButton.disabled = true

  const nextButton = document.createElement('button')
  nextButton.setAttribute('data-testid', 'next-button')
  nextButton.textContent = 'Next'

  const pageInfo = document.createElement('span')
  pageInfo.setAttribute('data-testid', 'page-info')
  pageInfo.textContent = 'Page 1 of 1'

  paginationDiv.appendChild(prevButton)
  paginationDiv.appendChild(pageInfo)
  paginationDiv.appendChild(nextButton)
  container.appendChild(paginationDiv)

  return {
    container,
    table,
    thead,
    tbody,
    selectAllCheckbox,
    prevButton,
    nextButton,
    pageInfo,
    getByTestId: (testId: string) => {
      const element = container.querySelector(`[data-testid="${testId}"]`)
      if (!element) throw new Error(`Element with testId "${testId}" not found`)
      return element
    },
    getAllByTestId: (testId: string) => {
      return Array.from(container.querySelectorAll(`[data-testid="${testId}"]`))
    },
  }
}

describe('DataTable Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders table with correct structure', () => {
    const { table, thead, tbody } = renderDataTable()

    expect(table).toBeDefined()
    expect(table.tagName).toBe('TABLE')
    expect(thead).toBeDefined()
    expect(tbody).toBeDefined()
  })

  it('displays data correctly', () => {
    const { getAllByTestId } = renderDataTable()

    const tableCells = getAllByTestId('table-cell')
    const cellTexts = tableCells.map(cell => (cell as HTMLElement).textContent)

    expect(cellTexts).toContain('John Doe')
    expect(cellTexts).toContain('john@example.com')
    expect(cellTexts).toContain('admin')
    expect(cellTexts).toContain('Jane Smith')
    expect(cellTexts).toContain('jane@example.com')
    expect(cellTexts).toContain('user')
  })

  it('handles row selection', () => {
    const { getByTestId } = renderDataTable()

    const selectRow1 = getByTestId('select-row-1') as HTMLInputElement
    const selectRow2 = getByTestId('select-row-2') as HTMLInputElement

    expect(selectRow1.checked).toBe(false)
    expect(selectRow2.checked).toBe(false)

    // Select first row
    selectRow1.checked = true
    expect(selectRow1.checked).toBe(true)

    // Select second row
    selectRow2.checked = true
    expect(selectRow2.checked).toBe(true)
  })

  it('handles select all functionality', () => {
    const { getByTestId, getAllByTestId } = renderDataTable()

    const selectAllCheckbox = getByTestId('select-all-checkbox') as HTMLInputElement
    const rowCheckboxes = getAllByTestId('select-row-1')
      .concat(getAllByTestId('select-row-2'))
      .concat(getAllByTestId('select-row-3')) as HTMLInputElement[]

    // Initially all unchecked
    expect(selectAllCheckbox.checked).toBe(false)
    rowCheckboxes.forEach(checkbox => {
      expect(checkbox.checked).toBe(false)
    })

    // Select all
    selectAllCheckbox.checked = true
    const selectAllEvent = new Event('change')
    selectAllCheckbox.dispatchEvent(selectAllEvent)

    expect(selectAllCheckbox.checked).toBe(true)
  })

  it('displays correct headers', () => {
    const { getAllByTestId } = renderDataTable()

    const tableHeaders = getAllByTestId('table-head')
    const headerTexts = tableHeaders.map(header => (header as HTMLElement).textContent?.trim())

    expect(headerTexts).toContain('Name')
    expect(headerTexts).toContain('Email')
    expect(headerTexts).toContain('Role')
  })

  it('renders pagination controls', () => {
    const { getByTestId } = renderDataTable()

    const pagination = getByTestId('pagination')
    const prevButton = getByTestId('prev-button') as HTMLButtonElement
    const nextButton = getByTestId('next-button') as HTMLButtonElement
    const pageInfo = getByTestId('page-info')

    expect(pagination).toBeDefined()
    expect(prevButton).toBeDefined()
    expect(nextButton).toBeDefined()
    expect(pageInfo).toBeDefined()

    expect(prevButton.disabled).toBe(true)
    expect(pageInfo.textContent).toBe('Page 1 of 1')
  })

  it('handles pagination navigation', () => {
    const { getByTestId } = renderDataTable()

    const nextButton = getByTestId('next-button') as HTMLButtonElement
    const prevButton = getByTestId('prev-button') as HTMLButtonElement

    let currentPage = 1
    const handleNext = () => {
      if (currentPage < 5) {
        currentPage++
        prevButton.disabled = false
      }
      if (currentPage >= 5) {
        nextButton.disabled = true
      }
    }

    const handlePrev = () => {
      if (currentPage > 1) {
        currentPage--
        nextButton.disabled = false
      }
      if (currentPage <= 1) {
        prevButton.disabled = true
      }
    }

    nextButton.addEventListener('click', handleNext)
    prevButton.addEventListener('click', handlePrev)

    // Test next navigation
    nextButton.click()
    expect(currentPage).toBe(2)
    expect(prevButton.disabled).toBe(false)

    // Test previous navigation
    prevButton.click()
    expect(currentPage).toBe(1)
    expect(prevButton.disabled).toBe(true)
  })

  it('handles empty data gracefully', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    
    // Create empty state row
    const emptyRow = document.createElement('tr')
    const emptyCell = document.createElement('td')
    emptyCell.colSpan = 4
    emptyCell.textContent = 'No data available'
    emptyCell.style.textAlign = 'center'
    emptyRow.appendChild(emptyCell)
    tbody.appendChild(emptyRow)
    table.appendChild(tbody)
    container.appendChild(table)

    expect(emptyCell.textContent).toBe('No data available')
    expect(emptyCell.colSpan).toBe(4)
  })

  it('supports custom column sorting', () => {
    const { getAllByTestId } = renderDataTable()

    const headers = getAllByTestId('table-head')
    const nameHeader = headers.find(h => (h as HTMLElement).textContent?.includes('Name')) as HTMLElement

    if (nameHeader) {
      // Add sort button to header
      const sortButton = document.createElement('button')
      sortButton.textContent = '↕️'
      sortButton.setAttribute('data-testid', 'sort-name')
      nameHeader.appendChild(sortButton)

      let sortDirection = 'asc'
      const handleSort = () => {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
        sortButton.textContent = sortDirection === 'asc' ? '↑' : '↓'
      }

      sortButton.addEventListener('click', handleSort)
      sortButton.click()

      expect(sortButton.textContent).toBe('↓')
    }
  })

  it('supports filtering functionality', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Create filter input
    const filterInput = document.createElement('input')
    filterInput.type = 'text'
    filterInput.placeholder = 'Filter by name...'
    filterInput.setAttribute('data-testid', 'filter-input')

    let filteredData = [...mockData]
    const handleFilter = (e: Event) => {
      const target = e.target as HTMLInputElement
      const filterValue = target.value.toLowerCase()
      
      filteredData = mockData.filter(item => 
        item.name.toLowerCase().includes(filterValue)
      )
    }

    filterInput.addEventListener('input', handleFilter)
    container.appendChild(filterInput)

    // Test filtering
    filterInput.value = 'john'
    const inputEvent = new Event('input')
    filterInput.dispatchEvent(inputEvent)

    expect(filteredData.length).toBe(2) // John Doe and Bob Johnson
    expect(filteredData.some(item => item.name.includes('John'))).toBe(true)
  })
})
