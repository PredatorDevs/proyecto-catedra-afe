(() => {
  const THEMES = ['corporate', 'dark']
  const SIDEBAR_KEY = 'sidebarCollapsed'

  const ICON_SUN =
    '<svg viewBox="0 0 20 20" fill="none" class="h-4 w-4"><circle cx="10" cy="10" r="3.2" stroke="currentColor" stroke-width="1.5"/><path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.2 1.2M5.9 14.1l-1.2 1.2M15.3 15.3l-1.2-1.2M5.9 5.9L4.7 4.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  const ICON_MOON =
    '<svg viewBox="0 0 20 20" fill="none" class="h-4 w-4"><path d="M13.9 2.9a7.2 7.2 0 106.2 10.8 7.4 7.4 0 01-6.2 1.2 7.2 7.2 0 01-5.1-8.7 7.4 7.4 0 015.1-3.3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

  function getSavedTheme() {
    const saved = localStorage.getItem('theme')
    return THEMES.includes(saved) ? saved : null
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    updateThemeToggleButton(theme)
  }

  function updateThemeToggleButton(currentTheme) {
    const btn = document.getElementById('themeToggle')
    if (!btn) return

    const iconContainer = btn.querySelector('.theme-toggle-icon')
    const labelContainer = btn.querySelector('.theme-toggle-label')
    if (!iconContainer || !labelContainer) return

    const current = THEMES.includes(currentTheme) ? currentTheme : 'corporate'
    const next = current === 'corporate' ? 'dark' : 'corporate'
    const nextIsLight = next === 'corporate'

    iconContainer.innerHTML = nextIsLight ? ICON_SUN : ICON_MOON
    labelContainer.textContent = nextIsLight ? 'Claro' : 'Oscuro'
    btn.setAttribute('aria-label', `Cambiar a tema ${nextIsLight ? 'claro' : 'oscuro'}`)
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const current = THEMES.includes(currentTheme) ? currentTheme : 'corporate'
    const next = current === 'corporate' ? 'dark' : 'corporate'
    applyTheme(next)
  }

  function applySidebarState(collapsed) {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (!isDesktop) {
      document.body.classList.remove('sidebar-collapsed')
      return
    }

    document.body.classList.toggle('sidebar-collapsed', collapsed)

    const toggleBtn = document.getElementById('sidebarToggle')
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', (!collapsed).toString())
    }
  }

  function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle')
    if (!toggleBtn) return

    const stored = localStorage.getItem(SIDEBAR_KEY)
    const initialCollapsed = stored === '1'
    applySidebarState(initialCollapsed)

    toggleBtn.addEventListener('click', () => {
      const nextCollapsed = !document.body.classList.contains('sidebar-collapsed')
      localStorage.setItem(SIDEBAR_KEY, nextCollapsed ? '1' : '0')
      applySidebarState(nextCollapsed)
    })

    window.addEventListener('resize', () => {
      const saved = localStorage.getItem(SIDEBAR_KEY) === '1'
      applySidebarState(saved)
    })
  }

  function normalizePath(pathname) {
    if (!pathname) return '/'
    if (pathname === '/') return '/'
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  }

  function initActiveSidebarLink() {
    const currentPath = normalizePath(window.location.pathname)
    const links = Array.from(document.querySelectorAll('.app-menu-link[href]'))

    if (links.length === 0) return

    links.forEach((link) => {
      link.classList.remove('is-active')
      link.removeAttribute('aria-current')
    })

    const sortedLinks = links
      .map((link) => ({ link, href: normalizePath(link.getAttribute('href') || '/') }))
      .sort((a, b) => b.href.length - a.href.length)

    const matched = sortedLinks.find(({ href }) => {
      if (href === '/') return currentPath === '/'
      return currentPath === href || currentPath.startsWith(`${href}/`)
    })

    if (!matched) return

    matched.link.classList.add('is-active')
    matched.link.setAttribute('aria-current', 'page')
  }

  function initRolePermissionsFilter() {
    const searchInput = document.getElementById('rolePermissionsSearch')
    if (!searchInput) return

    const items = Array.from(document.querySelectorAll('[data-permission-item]'))
    const emptyState = document.getElementById('rolePermissionsEmptyState')
    const visibleCount = document.getElementById('rolePermissionsVisibleCount')

    const applyFilter = () => {
      const query = (searchInput.value || '').trim().toLowerCase()
      let visible = 0

      items.forEach((item) => {
        const text = (item.getAttribute('data-search-text') || '').toLowerCase()
        const match = query.length === 0 || text.includes(query)
        item.classList.toggle('hidden', !match)
        if (match) visible += 1
      })

      if (visibleCount) visibleCount.textContent = String(visible)
      if (emptyState) emptyState.classList.toggle('hidden', visible !== 0)
    }

    searchInput.addEventListener('input', applyFilter)
    applyFilter()
  }

  // 1) aplica tema guardado al cargar
  const saved = getSavedTheme()
  if (saved) applyTheme(saved)
  else updateThemeToggleButton(document.documentElement.getAttribute('data-theme') || 'corporate')

  // 2) botón
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle')
    if (btn) {
      updateThemeToggleButton(document.documentElement.getAttribute('data-theme') || 'corporate')
      btn.addEventListener('click', toggleTheme)
    }

    initSidebarToggle()
    initActiveSidebarLink()
    initRolePermissionsFilter()
  })
})()