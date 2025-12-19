import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iSubrek - Subscription Tracker',
    short_name: 'iSubrek',
    description: 'Track and manage your subscriptions, monitor billing cycles, and never miss a payment',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Add Subscription',
        short_name: 'Add',
        description: 'Add a new subscription',
        url: '/?action=add',
        icons: [{ src: '/icons/add-icon.png', sizes: '96x96' }],
      },
    ],
  }
}
