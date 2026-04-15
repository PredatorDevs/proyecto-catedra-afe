import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import CashierShift from '#models/cashier_shift'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { createCashierShiftValidator } from '#validators/admin/hotels/create_cashier_shift_validator'
import {
  cashierShiftStatusLabel,
  cashierShiftStatusOptions,
} from '#controllers/admin/hotels/ui_enum_labels'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'

function asMoney(value: number | undefined, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return value
}

function buildShiftNumber() {
  const stamp = DateTime.now().toFormat('yyyyLLddHHmmss')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `SHIFT-${stamp}-${rand}`
}

export default class CashierShiftsController {
  private async fields(): Promise<CatalogField[]> {
    const users = await User.query().orderBy('id', 'desc').limit(300)

    return [
      { name: 'shiftNumber', label: 'Numero turno', colSpanMd: 2 },
      {
        name: 'openedByUserId',
        label: 'Abierto por',
        type: 'select',
        required: true,
        options: users.map((user) => ({ value: user.id, label: `${user.id} - ${user.fullName}` })),
      },
      {
        name: 'closedByUserId',
        label: 'Cerrado por',
        type: 'select',
        options: users.map((user) => ({ value: user.id, label: `${user.id} - ${user.fullName}` })),
      },
      { name: 'status', label: 'Estado', type: 'select', options: cashierShiftStatusOptions },
      { name: 'openedAt', label: 'Apertura', type: 'date', required: true },
      { name: 'closedAt', label: 'Cierre', type: 'date' },
      { name: 'openingAmount', label: 'Monto apertura', type: 'number', min: 0, step: '0.01' },
      { name: 'expectedCashAmount', label: 'Efectivo esperado', type: 'number', min: 0, step: '0.01' },
      { name: 'actualCashAmount', label: 'Efectivo real', type: 'number', min: 0, step: '0.01' },
      { name: 'differenceAmount', label: 'Diferencia', type: 'number', step: '0.01' },
      { name: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
    ]
  }

  async index(ctx: HttpContext) {
    const rows = await CashierShift.query().preload('openedByUser').preload('closedByUser').orderBy('id', 'desc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Caja',
        pageTitle: 'Turnos de Caja',
        pageSubtitle: 'Administra aperturas y cierres de turno para operaciones de efectivo.',
        createHref: '/admin/hotels/cashier-shifts/new',
        createLabel: 'Nuevo turno',
        editBaseHref: '/admin/hotels/cashier-shifts',
        columns: [
          { key: 'shiftNumber', label: 'Turno', badge: true },
          { key: 'status', label: 'Estado', badge: true },
          { key: 'openedBy', label: 'Abierto por' },
          { key: 'openedAt', label: 'Apertura' },
          { key: 'expectedCashAmount', label: 'Esperado' },
          { key: 'actualCashAmount', label: 'Real' },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          shiftNumber: row.shiftNumber,
          status: cashierShiftStatusLabel(row.status),
          openedBy: row.openedByUser?.fullName ?? `#${row.openedByUserId}`,
          openedAt: row.openedAt.toFormat('yyyy-LL-dd HH:mm'),
          expectedCashAmount: Number(row.expectedCashAmount).toFixed(2),
          actualCashAmount:
            row.actualCashAmount === null || row.actualCashAmount === undefined
              ? '-'
              : Number(row.actualCashAmount).toFixed(2),
        })),
      })
    }

    return ctx.response.ok({ data: rows })
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Caja',
      formTitle: 'Nuevo turno de caja',
      formSubtitle: 'Define apertura, responsable y montos base del turno.',
      formAction: '/admin/hotels/cashier-shifts',
      submitLabel: 'Crear turno',
      backHref: '/admin/hotels/cashier-shifts',
      fields: await this.fields(),
      values: {
        status: 'OPEN',
        openedAt: DateTime.now().toISODate(),
        openingAmount: 0,
        expectedCashAmount: 0,
        openedByUserId: ctx.auth.user?.id,
      },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await CashierShift.findOrFail(ctx.params.id)

    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Caja',
      formTitle: `Editar turno #${row.id}`,
      formSubtitle: 'Actualiza datos de cierre y conciliacion del turno.',
      formAction: `/admin/hotels/cashier-shifts/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/cashier-shifts',
      fields: await this.fields(),
      values: {
        shiftNumber: row.shiftNumber,
        openedByUserId: row.openedByUserId,
        closedByUserId: row.closedByUserId,
        status: row.status,
        openedAt: row.openedAt.toISODate(),
        closedAt: row.closedAt?.toISODate(),
        openingAmount: row.openingAmount,
        expectedCashAmount: row.expectedCashAmount,
        actualCashAmount: row.actualCashAmount,
        differenceAmount: row.differenceAmount,
        notes: row.notes,
      },
    })
  }

  private async ensureOpenShiftRule(status: string, currentId?: number) {
    if (status !== 'OPEN') return null

    const query = CashierShift.query().where('status', 'OPEN')
    if (currentId) query.whereNot('id', currentId)

    const otherOpen = await query.first()
    if (otherOpen) {
      return 'Ya existe un turno de caja abierto'
    }

    return null
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createCashierShiftValidator)
    const status = (payload.status as CashierShift['status'] | undefined) ?? 'OPEN'

    const openShiftConflict = await this.ensureOpenShiftRule(status)
    if (openShiftConflict) {
      return respondConflictOrRedirect(ctx, openShiftConflict, '/admin/hotels/cashier-shifts/new')
    }

    const row = await CashierShift.create({
      shiftNumber: payload.shiftNumber?.trim() || buildShiftNumber(),
      openedByUserId: payload.openedByUserId ?? ctx.auth.user!.id,
      closedByUserId: payload.closedByUserId ?? null,
      status,
      openedAt: DateTime.fromJSDate(payload.openedAt),
      closedAt: payload.closedAt ? DateTime.fromJSDate(payload.closedAt) : null,
      openingAmount: asMoney(payload.openingAmount),
      expectedCashAmount: asMoney(payload.expectedCashAmount),
      actualCashAmount: payload.actualCashAmount ?? null,
      differenceAmount: payload.differenceAmount ?? null,
      notes: payload.notes ?? null,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'cashier_shift',
        entityId: row.id,
        oldValues: null,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.cashierShifts.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Turno de caja creado', '/admin/hotels/cashier-shifts', row, true)
  }

  async update(ctx: HttpContext) {
    const row = await CashierShift.findOrFail(ctx.params.id)
    const payload = await ctx.request.validateUsing(createCashierShiftValidator)
    const status = (payload.status as CashierShift['status'] | undefined) ?? row.status

    const openShiftConflict = await this.ensureOpenShiftRule(status, row.id)
    if (openShiftConflict) {
      return respondConflictOrRedirect(ctx, openShiftConflict, `/admin/hotels/cashier-shifts/${row.id}/edit`)
    }

    const previous = row.serialize()

    row.shiftNumber = payload.shiftNumber?.trim() || row.shiftNumber
    row.openedByUserId = payload.openedByUserId ?? row.openedByUserId
    row.closedByUserId = payload.closedByUserId ?? row.closedByUserId
    row.status = status
    row.openedAt = DateTime.fromJSDate(payload.openedAt)
    row.closedAt = payload.closedAt ? DateTime.fromJSDate(payload.closedAt) : row.closedAt
    row.openingAmount = payload.openingAmount ?? row.openingAmount
    row.expectedCashAmount = payload.expectedCashAmount ?? row.expectedCashAmount
    row.actualCashAmount = payload.actualCashAmount ?? row.actualCashAmount

    if (row.actualCashAmount !== null && row.actualCashAmount !== undefined) {
      row.differenceAmount = Number(row.actualCashAmount) - Number(row.expectedCashAmount)
    } else {
      row.differenceAmount = payload.differenceAmount ?? row.differenceAmount
    }

    row.notes = payload.notes ?? row.notes

    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'cashier_shift',
        entityId: row.id,
        oldValues: previous,
        newValues: row.serialize(),
        metadata: { source: 'admin.hotels.cashierShifts.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Turno de caja actualizado', '/admin/hotels/cashier-shifts', row)
  }
}
