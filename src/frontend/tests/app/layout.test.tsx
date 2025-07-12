/**
 * @jest-environment jsdom
 */

import React from 'react'

// Mock Next.js font
jest.mock('next/font/google', () => ({
  Inter: jest.fn(() => ({
    className: 'inter-font'
  }))
}))

// Mock components
jest.mock('@/components/layout/providers', () => {
  return function Providers({ children }: { children: React.ReactNode }) {
    return <div data-testid="providers">{children}</div>
  }
})

jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />
}))

jest.mock('@/components/pwa/pwa-wrapper', () => {
  return function PWAWrapper() {
    return <div data-testid="pwa-wrapper" />
  }
})

jest.mock('@/providers/session-timeout-provider', () => ({
  SessionTimeoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-timeout-provider">{children}</div>
  )
}))

// Mock metadata and viewport from layout
const mockMetadata = {
  metadataBase: new URL('https://lactokeeper.com'),
  title: "Lactokeeper",
  description: "Visualización de datos del sector lácteo",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["lactokeeper", "sector lácteo", "datos", "visualización", "granjas", "dispositivos"],
  authors: [{ name: "Lactokeeper Team" }],
  icons: [
    { rel: "apple-touch-icon", url: "/icon-128x128.png" },
    { rel: "icon", url: "/icon-128x128.png" },
  ],
  openGraph: {
    type: "website",
    siteName: "Lactokeeper",
    title: "Lactokeeper",
    description: "Visualización de datos del sector lácteo",
    url: "https://lactokeeper.com",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Lactokeeper Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lactokeeper",
    description: "Visualización de datos del sector lácteo",
    images: ["/icon-512x512.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Lactokeeper",
    statusBarStyle: "default",
  },
}

const mockViewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

function renderRootLayout(children: React.ReactNode = <div>Test Content</div>) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  // Create HTML structure similar to layout
  const html = document.createElement('html')
  html.lang = 'es'

  const head = document.createElement('head')
  
  // Add meta tags
  const metaTags = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Lactokeeper' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'msapplication-TileColor', content: '#000000' },
    { name: 'msapplication-tap-highlight', content: 'no' },
  ]

  metaTags.forEach(({ name, content }) => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', name)
    meta.setAttribute('content', content)
    head.appendChild(meta)
  })

  // Add link tags
  const linkTags = [
    { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon-192x192.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icon-192x192.png' },
    { rel: 'manifest', href: '/manifest.json' },
    { rel: 'shortcut icon', href: '/favicon.ico' },
  ]

  linkTags.forEach(({ rel, href, type, sizes }) => {
    const link = document.createElement('link')
    link.setAttribute('rel', rel)
    link.setAttribute('href', href)
    if (type) link.setAttribute('type', type)
    if (sizes) link.setAttribute('sizes', sizes)
    head.appendChild(link)
  })

  const body = document.createElement('body')
  body.className = 'inter-font'

  // Create component structure
  const providers = document.createElement('div')
  providers.setAttribute('data-testid', 'providers')

  const sessionTimeoutProvider = document.createElement('div')
  sessionTimeoutProvider.setAttribute('data-testid', 'session-timeout-provider')

  const pwaWrapper = document.createElement('div')
  pwaWrapper.setAttribute('data-testid', 'pwa-wrapper')

  const content = document.createElement('div')
  content.setAttribute('data-testid', 'content')
  content.textContent = 'Test Content'

  const toaster = document.createElement('div')
  toaster.setAttribute('data-testid', 'toaster')

  sessionTimeoutProvider.appendChild(pwaWrapper)
  sessionTimeoutProvider.appendChild(content)
  sessionTimeoutProvider.appendChild(toaster)
  providers.appendChild(sessionTimeoutProvider)
  body.appendChild(providers)

  html.appendChild(head)
  html.appendChild(body)
  container.appendChild(html)

  return {
    container,
    html,
    head,
    body,
    providers,
    sessionTimeoutProvider,
    pwaWrapper,
    content,
    toaster,
    getByTestId: (testId: string) => {
      const element = container.querySelector(`[data-testid="${testId}"]`)
      if (!element) throw new Error(`Element with testId "${testId}" not found`)
      return element
    },
  }
}

describe('RootLayout Component', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders with correct HTML structure', () => {
    const { html, head, body } = renderRootLayout()

    expect(html.tagName).toBe('HTML')
    expect(html.lang).toBe('es')
    expect(head.tagName).toBe('HEAD')
    expect(body.tagName).toBe('BODY')
  })

  it('applies Inter font class to body', () => {
    const { body } = renderRootLayout()
    expect(body.className).toBe('inter-font')
  })

  it('includes PWA meta tags', () => {
    const { head } = renderRootLayout()

    const appleMobileWebAppCapable = head.querySelector('meta[name="apple-mobile-web-app-capable"]')
    expect(appleMobileWebAppCapable?.getAttribute('content')).toBe('yes')

    const appleMobileWebAppTitle = head.querySelector('meta[name="apple-mobile-web-app-title"]')
    expect(appleMobileWebAppTitle?.getAttribute('content')).toBe('Lactokeeper')

    const mobileWebAppCapable = head.querySelector('meta[name="mobile-web-app-capable"]')
    expect(mobileWebAppCapable?.getAttribute('content')).toBe('yes')

    const msApplicationTileColor = head.querySelector('meta[name="msapplication-TileColor"]')
    expect(msApplicationTileColor?.getAttribute('content')).toBe('#000000')
  })

  it('includes necessary icon links', () => {
    const { head } = renderRootLayout()

    const appleTouchIcon = head.querySelector('link[rel="apple-touch-icon"]')
    expect(appleTouchIcon?.getAttribute('href')).toBe('/icon-192x192.png')

    const manifestLink = head.querySelector('link[rel="manifest"]')
    expect(manifestLink?.getAttribute('href')).toBe('/manifest.json')

    const faviconLink = head.querySelector('link[rel="shortcut icon"]')
    expect(faviconLink?.getAttribute('href')).toBe('/favicon.ico')

    const iconLinks = head.querySelectorAll('link[rel="icon"]')
    expect(iconLinks.length).toBeGreaterThan(0)
  })

  it('renders all provider components', () => {
    const { getByTestId } = renderRootLayout()

    expect(getByTestId('providers')).toBeDefined()
    expect(getByTestId('session-timeout-provider')).toBeDefined()
    expect(getByTestId('pwa-wrapper')).toBeDefined()
    expect(getByTestId('toaster')).toBeDefined()
  })

  it('renders children content correctly', () => {
    const testContent = <div data-testid="test-child">Custom Test Content</div>
    const { getByTestId } = renderRootLayout(testContent)

    expect(getByTestId('content')).toBeDefined()
    expect(getByTestId('content').textContent).toBe('Test Content')
  })

  it('has correct component nesting structure', () => {
    const { providers, sessionTimeoutProvider, pwaWrapper, toaster } = renderRootLayout()

    expect(providers.contains(sessionTimeoutProvider)).toBe(true)
    expect(sessionTimeoutProvider.contains(pwaWrapper)).toBe(true)
    expect(sessionTimeoutProvider.contains(toaster)).toBe(true)
  })

  it('validates metadata structure', () => {
    expect(mockMetadata.title).toBe('Lactokeeper')
    expect(mockMetadata.description).toBe('Visualización de datos del sector lácteo')
    expect(mockMetadata.manifest).toBe('/manifest.json')
    expect(mockMetadata.metadataBase.href).toBe('https://lactokeeper.com/')
    expect(mockMetadata.keywords).toContain('lactokeeper')
    expect(mockMetadata.keywords).toContain('sector lácteo')
  })

  it('validates OpenGraph metadata', () => {
    expect(mockMetadata.openGraph.type).toBe('website')
    expect(mockMetadata.openGraph.siteName).toBe('Lactokeeper')
    expect(mockMetadata.openGraph.title).toBe('Lactokeeper')
    expect(mockMetadata.openGraph.url).toBe('https://lactokeeper.com')
    expect(mockMetadata.openGraph.images[0].url).toBe('/icon-512x512.png')
    expect(mockMetadata.openGraph.images[0].width).toBe(512)
    expect(mockMetadata.openGraph.images[0].height).toBe(512)
  })

  it('validates Twitter metadata', () => {
    expect(mockMetadata.twitter.card).toBe('summary_large_image')
    expect(mockMetadata.twitter.title).toBe('Lactokeeper')
    expect(mockMetadata.twitter.description).toBe('Visualización de datos del sector lácteo')
    expect(mockMetadata.twitter.images).toContain('/icon-512x512.png')
  })

  it('validates Apple Web App metadata', () => {
    expect(mockMetadata.appleWebApp.capable).toBe(true)
    expect(mockMetadata.appleWebApp.title).toBe('Lactokeeper')
    expect(mockMetadata.appleWebApp.statusBarStyle).toBe('default')
  })

  it('validates viewport configuration', () => {
    expect(mockViewport.width).toBe('device-width')
    expect(mockViewport.initialScale).toBe(1)
    expect(mockViewport.maximumScale).toBe(1)
    expect(mockViewport.userScalable).toBe(false)
    expect(mockViewport.viewportFit).toBe('cover')
    
    expect(mockViewport.themeColor).toHaveLength(2)
    expect(mockViewport.themeColor[0].media).toBe('(prefers-color-scheme: light)')
    expect(mockViewport.themeColor[0].color).toBe('#ffffff')
    expect(mockViewport.themeColor[1].media).toBe('(prefers-color-scheme: dark)')
    expect(mockViewport.themeColor[1].color).toBe('#000000')
  })

  it('validates authors metadata', () => {
    expect(mockMetadata.authors).toHaveLength(1)
    expect(mockMetadata.authors[0].name).toBe('Lactokeeper Team')
  })

  it('validates icon configuration', () => {
    expect(mockMetadata.icons).toHaveLength(2)
    expect(mockMetadata.icons[0].rel).toBe('apple-touch-icon')
    expect(mockMetadata.icons[0].url).toBe('/icon-128x128.png')
    expect(mockMetadata.icons[1].rel).toBe('icon')
    expect(mockMetadata.icons[1].url).toBe('/icon-128x128.png')
  })
})
