import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isPortalBuild = loadEnv(mode, '.', 'VITE_').VITE_SITE_ROLE === 'portal'
  const siteMetadata = isPortalBuild
    ? {
        title: 'Patient & Staff Portal | Peaceloving Home Health Inc.',
        description: 'Patient and staff sign-in for the Peaceloving Home Health workspace.',
        robots: 'noindex, nofollow',
      }
    : {
        title: 'Peaceloving Home Health Inc. | In-Home Care',
        description: 'Explore home health services, our care team, careers, and contact options from Peaceloving Home Health Inc.',
        robots: 'index, follow',
      }

  return {
    plugins: [
      react(),
      {
        name: 'site-specific-metadata',
        transformIndexHtml(html) {
          return html
            .replace('__SITE_TITLE__', siteMetadata.title)
            .replace('__SITE_DESCRIPTION__', siteMetadata.description)
            .replace('__SITE_ROBOTS__', siteMetadata.robots)
        },
      },
    ],
  }
})
