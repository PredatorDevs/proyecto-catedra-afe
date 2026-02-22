import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

type AuditPayload = {
  action: string
  entity: string
  entityId?: string | number | null
  userId?: number | null
  metadata?: Record<string, unknown> | null
}

export default class AuditLogger {
  static async log(payload: AuditPayload, ctx?: HttpContext) {
    const resolvedUserId = payload.userId ?? ctx?.auth.user?.id ?? null
    const ip = ctx?.request.ip() ?? null
    const userAgent = ctx?.request.header('user-agent') ?? null

    await AuditLog.create({
      userId: resolvedUserId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId ? String(payload.entityId) : null,
      ip,
      userAgent,
      metadata: payload.metadata ?? null,
    })
  }
}
