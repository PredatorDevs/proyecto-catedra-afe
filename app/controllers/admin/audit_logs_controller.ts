import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

export default class AuditLogsController {
  async index({ view, request }: HttpContext) {
    const actionFilter = String(request.input('action', '')).trim()
    const entityFilter = String(request.input('entity', '')).trim()
    const fromFilter = String(request.input('from', '')).trim()
    const toFilter = String(request.input('to', '')).trim()
    const pageInput = Number(request.input('page', 1))
    const page = Number.isFinite(pageInput) && pageInput > 0 ? Math.floor(pageInput) : 1
    const perPage = 25

    const applyFilters = (query: ReturnType<typeof AuditLog.query>) => {
      if (actionFilter) query.where('action', actionFilter)
      if (entityFilter) query.where('entity', entityFilter)
      if (fromFilter) query.where('created_at', '>=', `${fromFilter} 00:00:00`)
      if (toFilter) query.where('created_at', '<=', `${toFilter} 23:59:59`)
      return query
    }

    const paginated = await applyFilters(AuditLog.query().preload('user').orderBy('created_at', 'desc')).paginate(
      page,
      perPage
    )

    const meta = paginated.getMeta()
    const auditLogs = paginated.all()

    const countRows = await Promise.all([
      applyFilters(AuditLog.query()).count('* as total').first(),
      applyFilters(AuditLog.query()).where('action', 'like', '%CREATE%').count('* as total').first(),
      applyFilters(AuditLog.query()).where('action', 'like', '%UPDATE%').count('* as total').first(),
      applyFilters(AuditLog.query()).where('action', 'like', '%DELETE%').count('* as total').first(),
      applyFilters(AuditLog.query())
        .where((builder) => {
          builder.where('action', 'like', '%LOGIN%').orWhere('action', 'like', '%LOGOUT%')
        })
        .count('* as total')
        .first(),
    ])

    const toNumber = (value: unknown): number => Number(value || 0)
    const countFromRow = (row: unknown): number => {
      const extraValue = (row as { $extras?: { total?: unknown } } | null)?.$extras?.total
      return toNumber(extraValue)
    }
    const [totalRow, createRow, updateRow, deleteRow, authRow] = countRows

    const actions = await AuditLog.query().select('action').distinct('action').orderBy('action', 'asc')
    const entities = await AuditLog.query().select('entity').distinct('entity').orderBy('entity', 'asc')

    const queryParams = new URLSearchParams()
    if (actionFilter) queryParams.set('action', actionFilter)
    if (entityFilter) queryParams.set('entity', entityFilter)
    if (fromFilter) queryParams.set('from', fromFilter)
    if (toFilter) queryParams.set('to', toFilter)

    const baseQuery = queryParams.toString()
    const pageUrl = (targetPage: number) =>
      `/admin/audit-logs?${baseQuery ? `${baseQuery}&` : ''}page=${targetPage}`

    const startPage = Math.max(1, meta.currentPage - 2)
    const endPage = Math.min(meta.lastPage, meta.currentPage + 2)
    const pages: number[] = []
    for (let i = startPage; i <= endPage; i++) pages.push(i)
    const pageUrls = Object.fromEntries(pages.map((num) => [num, pageUrl(num)]))

    return view.render('pages/admin/audit_logs', {
      auditLogs,
      auditStats: {
        total: countFromRow(totalRow),
        create: countFromRow(createRow),
        update: countFromRow(updateRow),
        delete: countFromRow(deleteRow),
        auth: countFromRow(authRow),
      },
      filters: {
        action: actionFilter,
        entity: entityFilter,
        from: fromFilter,
        to: toFilter,
      },
      filterOptions: {
        actions: actions.map((item) => item.action),
        entities: entities.map((item) => item.entity),
      },
      pagination: {
        currentPage: meta.currentPage,
        lastPage: meta.lastPage,
        total: meta.total,
        perPage: meta.perPage,
        hasPages: meta.lastPage > 1,
        pages,
        pageUrls,
        prevUrl: meta.currentPage > 1 ? pageUrl(meta.currentPage - 1) : null,
        nextUrl: meta.currentPage < meta.lastPage ? pageUrl(meta.currentPage + 1) : null,
      },
    })
  }
}
