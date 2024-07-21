"use client"
import { QueryClient, QueryClientProvider as ReactQueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

export function QueryClientProvider1({ children }: { children: ReactNode }) {
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  )
}