import { RouterProvider } from 'react-router'

import { AppProviders } from '@/providers/app-providers'
import { router } from '@/app/router'

/**
 * App root: wires providers around the router. This is the only component
 * `main.tsx` mounts — see CLAUDE.md §4 (`app/` = "app shell: root
 * component, router setup, providers wiring").
 */
function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export { App }
