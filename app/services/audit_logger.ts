import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

type JsonObject = Record<string, unknown>

type AuditPayload = {
  action: string
  entity: string
  entityId?: string | number | null
  userId?: number | null
  requestId?: string | null
  oldValues?: JsonObject | null
  newValues?: JsonObject | null
  changedFields?: string[] | null
  metadata?: JsonObject | null
}

export default class AuditLogger {
  private static detectChangedFields(oldValues?: JsonObject | null, newValues?: JsonObject | null) {
    if (!oldValues && !newValues) {
      return null
    }

    const keys = Array.from(new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]))
    const changed = keys.filter((key) => {
      const previous = oldValues?.[key]
      const current = newValues?.[key]
      return JSON.stringify(previous) !== JSON.stringify(current)
    })

    return changed.length ? changed : null
  }

  static async log(payload: AuditPayload, ctx?: HttpContext) {
    const resolvedUserId = payload.userId ?? ctx?.auth.user?.id ?? null
    const ip = ctx?.request.ip() ?? null
    const userAgent = ctx?.request.header('user-agent') ?? null
    const requestId = payload.requestId ?? ctx?.request.header('x-request-id') ?? null
    const changedFields = payload.changedFields ?? this.detectChangedFields(payload.oldValues, payload.newValues)

    await AuditLog.create({
      userId: resolvedUserId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId ? String(payload.entityId) : null,
      ip,
      userAgent,
      requestId,
      oldValues: payload.oldValues ?? null,
      newValues: payload.newValues ?? null,
      changedFields,
      metadata: payload.metadata ?? null,
    })
  }
}
