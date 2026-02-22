import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

export default class AuditLogsController {
  async index({ view }: HttpContext) {
    const auditLogs = await AuditLog.query().preload('user').orderBy('created_at', 'desc').limit(200)

    return view.render('pages/admin/audit_logs', {
      auditLogs,
    })
  }
}
