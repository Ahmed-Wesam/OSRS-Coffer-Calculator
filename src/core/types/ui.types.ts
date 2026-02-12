// UI-Specific Types

import type { ReactNode } from 'react'
import type { DeathCofferItem } from './domain.types'

// Component Props
export interface BaseComponentProps {
  className?: string
  testId?: string
  'aria-label'?: string
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: ReactNode
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'number' | 'email' | 'password'
  placeholder?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  error?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}

export interface PaginationProps {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export interface TableProps<T> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  empty?: ReactNode
  onRowClick?: (row: T) => void
  sortable?: boolean
  pagination?: PaginationProps
}

export interface TableColumn<T> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  text?: string
  overlay?: boolean
}

// State Management
export interface UIState {
  loading: boolean
  error: string | null
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
}

export interface DeathCofferUIState extends UIState {
  data: DeathCofferItem[]
  filters: FilterState
  pagination: PaginationState
  sort: SortState
  dataInfo: DataInfoState
}

export interface FilterState {
  minRoi: string
  maxRoi: string
  minBuyPrice: string
  maxBuyPrice: string
  searchQuery: string
  itemTypes: string[]
  membersOnly: boolean
}

export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
}

export interface SortState {
  field: keyof DeathCofferItem
  direction: 'asc' | 'desc'
}

export interface DataInfoState {
  date: string
  timestamp?: string
  isFallback?: boolean
  fallbackDate?: string
  sourceFiles?: Array<{
    filename: string
    timestamp: string
    itemCount: number
  }>
}

// Forms
export interface FormField<T = string> {
  value: T
  error?: string
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FormField<T[K]>
  }
  isValid: boolean
  isSubmitting: boolean
  submitCount: number
}

// Events
export interface UIEvent {
  type: string
  payload: unknown
  timestamp: string
}

export interface FilterChangeEvent extends UIEvent {
  type: 'filter.changed'
  payload: Partial<FilterState>
}

export interface SortChangeEvent extends UIEvent {
  type: 'sort.changed'
  payload: SortState
}

export interface PageChangeEvent extends UIEvent {
  type: 'page.changed'
  payload: {
    page: number
    itemsPerPage: number
  }
}

// Layout
export interface LayoutProps {
  children: ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
}

export interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export interface SidebarProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

// Notifications
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  dismissible?: boolean
  timestamp: string
}

export interface NotificationState {
  notifications: Notification[]
}

// Modals
export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closable?: boolean
}

// Responsive
export interface Breakpoint {
  name: string
  minWidth: number
  maxWidth?: number
}

export interface ResponsiveState {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

// Animation
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
}

export interface TransitionProps {
  in: boolean
  timeout?: number
  animation?: AnimationConfig
  onEnter?: () => void
  onExit?: () => void
  children: ReactNode
}

// Accessibility
export interface AriaProps {
  role?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaSelected?: boolean
  ariaDisabled?: boolean
}

// Theme
export interface Theme {
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  typography: {
    fontFamily: string
    fontSize: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
    }
    fontWeight: {
      normal: number
      medium: number
      bold: number
    }
  }
  shadows: {
    sm: string
    md: string
    lg: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
  }
}
