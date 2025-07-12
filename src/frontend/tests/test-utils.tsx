// Test utilities
import React from 'react'

interface CustomRenderOptions {
  session?: any
}

function CustomProvider({ children, session = null }: { children: React.ReactNode; session?: any }) {
  return (
    <div data-testid="test-provider">
      {children}
    </div>
  )
}

const customRender = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  const { session } = options
  
  return (
    <CustomProvider session={session}>
      {ui}
    </CustomProvider>
  )
}

export { customRender as render }
