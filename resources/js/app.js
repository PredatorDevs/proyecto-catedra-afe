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
    const modeButtons = Array.from(document.querySelectorAll('[data-permission-filter]'))
    const emptyState = document.getElementById('rolePermissionsEmptyState')
    const visibleCount = document.getElementById('rolePermissionsVisibleCount')
    let mode = 'all'

    const applyFilter = () => {
      const query = (searchInput.value || '').trim().toLowerCase()
      let visible = 0

      items.forEach((item) => {
        const text = (item.getAttribute('data-search-text') || '').toLowerCase()
        const matchesQuery = query.length === 0 || text.includes(query)
        const isAssigned = item.getAttribute('data-assigned') === '1'
        const matchesMode =
          mode === 'all' || (mode === 'assigned' && isAssigned) || (mode === 'unassigned' && !isAssigned)
        const match = matchesQuery && matchesMode
        item.classList.toggle('hidden', !match)
        if (match) visible += 1
      })

      if (visibleCount) visibleCount.textContent = String(visible)
      if (emptyState) emptyState.classList.toggle('hidden', visible !== 0)
    }

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.getAttribute('data-permission-filter') || 'all'
        modeButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button))
        applyFilter()
      })
    })

    searchInput.addEventListener('input', applyFilter)
    applyFilter()
  }

  function initReservationCancellationModal() {
    const modal = document.getElementById('reservationCancelModal')
    const form = document.getElementById('reservationCancelForm')
    if (!modal || !form) return

    const reasonField = form.querySelector('textarea[name="cancellationReason"]')
    const label = modal.querySelector('[data-cancel-target-label]')
    const closeButton = modal.querySelector('[data-cancel-close]')
    const triggers = Array.from(document.querySelectorAll('[data-cancel-trigger]'))

    if (triggers.length === 0) return

    const closeModal = () => {
      if (typeof modal.close === 'function') {
        modal.close()
      }
    }

    closeButton?.addEventListener('click', closeModal)

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const id = trigger.getAttribute('data-cancel-id')
        const targetLabel = trigger.getAttribute('data-cancel-label') || id || '#-'
        if (!id) return

        form.setAttribute('action', `/admin/hotels/reservations/${id}/cancel`)
        if (label) {
          label.textContent = targetLabel
        }
        if (reasonField) {
          reasonField.value = ''
        }

        if (typeof modal.showModal === 'function') {
          modal.showModal()
          reasonField?.focus()
        }
      })
    })
  }

  function initConditionalCatalogFields() {
    const conditionalItems = Array.from(document.querySelectorAll('[data-show-when-field]')).filter((item) => {
      const fieldName = item.getAttribute('data-show-when-field')
      return Boolean(fieldName && fieldName.trim())
    })

    if (conditionalItems.length === 0) return

    const normalize = (value) => String(value || '').trim().toUpperCase()

    const setItemVisibility = (item) => {
      const dependencyField = item.getAttribute('data-show-when-field')
      const allowedValues = (item.getAttribute('data-show-when-values') || '')
        .split('|')
        .map((entry) => normalize(entry))
        .filter(Boolean)

      if (!dependencyField || allowedValues.length === 0) {
        return
      }

      const dependencyInput = document.querySelector(`[name="${dependencyField}"]`)
      if (!dependencyInput) {
        return
      }

      const currentValue = normalize(dependencyInput.value)
      const shouldShow = allowedValues.includes(currentValue)

      item.classList.toggle('hidden', !shouldShow)

      const controls = Array.from(item.querySelectorAll('input, select, textarea'))
      controls.forEach((control) => {
        if (shouldShow) {
          control.disabled = false
          if (control.dataset.wasRequired === '1') {
            control.required = true
            delete control.dataset.wasRequired
          }
          return
        }

        if (control.required) {
          control.dataset.wasRequired = '1'
        }
        control.required = false
        control.disabled = true
      })
    }

    const dependencies = Array.from(
      new Set(conditionalItems.map((item) => item.getAttribute('data-show-when-field')).filter(Boolean))
    )

    dependencies.forEach((dependencyField) => {
      const dependencyInput = document.querySelector(`[name="${dependencyField}"]`)
      if (!dependencyInput) return

      dependencyInput.addEventListener('change', () => {
        conditionalItems.forEach(setItemVisibility)
      })
    })

    conditionalItems.forEach(setItemVisibility)
  }

  function initCustomerFullNameAutofill() {
    const fullNameInput = document.querySelector('[name="fullName"]')
    const firstNameInput = document.querySelector('[name="firstName"]')
    const lastNameInput = document.querySelector('[name="lastName"]')
    const taxNameInput = document.querySelector('[name="taxName"]')
    const customerTypeInput = document.querySelector('[name="customerType"]')

    if (!fullNameInput || !customerTypeInput) return

    const normalize = (value) => String(value || '').trim()

    const compose = () => {
      const customerType = normalize(customerTypeInput.value).toUpperCase()
      const first = normalize(firstNameInput?.value)
      const last = normalize(lastNameInput?.value)
      const taxName = normalize(taxNameInput?.value)

      let computed = ''
      if (customerType === 'COMPANY') {
        computed = taxName
      } else {
        computed = [first, last].filter(Boolean).join(' ')
      }

      fullNameInput.value = computed
    }

    customerTypeInput.addEventListener('change', compose)
    firstNameInput?.addEventListener('input', compose)
    lastNameInput?.addEventListener('input', compose)
    taxNameInput?.addEventListener('input', compose)

    compose()
  }

  function initReservationPricingPreview() {
    const roomTypeSelect = document.querySelector('[name="roomTypeId"]')
    const roomPriceSelect = document.querySelector('[name="appliedRoomPriceId"]')
    const adultsInput = document.querySelector('[name="adultsCount"]')
    const childrenInput = document.querySelector('[name="childrenCount"]')
    const guestsInput = document.querySelector('[name="guestsCount"]')
    const checkInInput = document.querySelector('[name="checkInPlannedAt"]')
    const checkOutInput = document.querySelector('[name="checkOutPlannedAt"]')
    const discountInput = document.querySelector('[name="discountTotal"]')
    const ivaInput = document.querySelector('[name="ivaTotal"]')
    const tourismTaxInput = document.querySelector('[name="tourismTaxTotal"]')
    const subtotalInput = document.querySelector('[name="lodgingSubtotal"]')

    if (
      !roomTypeSelect ||
      !roomPriceSelect ||
      !adultsInput ||
      !childrenInput ||
      !guestsInput ||
      !checkInInput ||
      !checkOutInput ||
      !subtotalInput
    ) {
      return
    }

    const subtotalField = subtotalInput.closest('.app-form-field')
    if (!subtotalField) return

    let panel = document.getElementById('reservationPricingPreview')
    if (!panel) {
      panel = document.createElement('div')
      panel.id = 'reservationPricingPreview'
      panel.className =
        'md:col-span-2 xl:col-span-3 rounded-xl border border-base-300 bg-base-200/40 p-3 text-sm leading-relaxed'
      panel.innerHTML = '<strong>Estimación de cobro:</strong> completa fechas y ocupación para ver el detalle.'
      subtotalField.insertAdjacentElement('afterend', panel)
    }

    const parseNumber = (value, fallback = 0) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100

    const parseDate = (value) => {
      if (!value) return null
      const date = new Date(`${value}T00:00:00`)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const getSelectedOption = (select) => {
      if (!select || !select.options || select.selectedIndex < 0) return null
      const option = select.options[select.selectedIndex]
      if (!option || !option.value) return null
      return option
    }

    const compute = () => {
      const checkIn = parseDate(checkInInput.value)
      const checkOut = parseDate(checkOutInput.value)

      if (!checkIn || !checkOut || checkOut <= checkIn) {
        panel.innerHTML =
          '<strong>Estimación de cobro:</strong> define un rango de fechas válido para calcular noches y subtotal.'
        subtotalInput.value = ''
        return
      }

      const msPerDay = 24 * 60 * 60 * 1000
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / msPerDay))
      const adults = Math.max(1, parseNumber(adultsInput.value, 1))
      const children = Math.max(0, parseNumber(childrenInput.value, 0))
      const guests = Math.max(1, parseNumber(guestsInput.value, adults + children))

      const selectedType = getSelectedOption(roomTypeSelect)
      const baseCapacity = parseNumber(selectedType?.dataset.baseCapacity, 1)
      const defaultNightlyPrice = parseNumber(selectedType?.dataset.defaultNightlyPrice, 0)
      const selectedPrice = getSelectedOption(roomPriceSelect)

      const extraGuests = Math.max(0, guests - baseCapacity)
      let subtotal = 0
      let formula = ''
      let source = ''

      if (selectedPrice) {
        const basePrice = parseNumber(selectedPrice.dataset.basePrice, 0)
        const extraGuestPrice = parseNumber(selectedPrice.dataset.extraGuestPrice, 0)
        const priceBasis = selectedPrice.dataset.priceBasis || 'NIGHT'
        const pricingScope = selectedPrice.dataset.pricingScope || 'ROOM_TYPE'
        const unitAmount = basePrice + extraGuestPrice * extraGuests
        subtotal = priceBasis === 'STAY' ? unitAmount : unitAmount * nights
        formula =
          priceBasis === 'STAY'
            ? `${basePrice.toFixed(2)} + (${extraGuestPrice.toFixed(2)} x ${extraGuests} huésped(es) extra)`
            : `(${basePrice.toFixed(2)} + ${extraGuestPrice.toFixed(2)} x ${extraGuests}) x ${nights} noche(s)`
        source = `Tarifa manual seleccionada (${pricingScope === 'ROOM' ? 'por habitación' : 'por tipo'})`
      } else {
        subtotal = defaultNightlyPrice * nights
        formula = `${defaultNightlyPrice.toFixed(2)} x ${nights} noche(s)`
        source = 'Estimación por precio base del tipo (la tarifa final se resuelve en servidor)'
      }

      subtotal = round(subtotal)
      subtotalInput.value = subtotal.toFixed(2)

      const discount = parseNumber(discountInput?.value, 0)
      const iva = parseNumber(ivaInput?.value, 0)
      const tourismTax = parseNumber(tourismTaxInput?.value, 0)
      const total = round(Math.max(0, subtotal - discount + iva + tourismTax))

      panel.innerHTML = [
        '<strong>Fórmula de cobro estimada</strong>',
        `<div>Fuente: ${source}</div>`,
        `<div>Ocupación: ${guests} huésped(es), capacidad base ${baseCapacity}, extras ${extraGuests}</div>`,
        `<div>Hospedaje: ${formula} = <strong>${subtotal.toFixed(2)}</strong></div>`,
        `<div>Total estimado: ${subtotal.toFixed(2)} - ${discount.toFixed(2)} + ${iva.toFixed(2)} + ${tourismTax.toFixed(2)} = <strong>${total.toFixed(2)}</strong></div>`,
      ].join('')
    }

    const watch = [
      roomTypeSelect,
      roomPriceSelect,
      adultsInput,
      childrenInput,
      guestsInput,
      checkInInput,
      checkOutInput,
      discountInput,
      ivaInput,
      tourismTaxInput,
    ]

    watch.forEach((element) => {
      if (!element) return
      element.addEventListener('input', compute)
      element.addEventListener('change', compute)
    })

    compute()
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
    initReservationCancellationModal()
    initConditionalCatalogFields()
    initCustomerFullNameAutofill()
    initReservationPricingPreview()
  })
})()