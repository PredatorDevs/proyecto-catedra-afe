import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Customer from '#models/customer'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { createCustomerValidator } from '#validators/admin/hotels/create_customer_validator'
import {
  prefersHtml,
  renderCatalogForm,
  renderCatalogIndex,
  respondConflictOrRedirect,
  respondSuccessOrJson,
  type CatalogField,
} from '#controllers/admin/hotels/ui_support'
import {
  customerTypeLabel,
  customerTypeOptions,
  documentTypeOptions,
} from '#controllers/admin/hotels/ui_enum_labels'

type CustomerType = 'INDIVIDUAL' | 'COMPANY'

export default class CustomersController {
  private validateCustomerTypeFields(payload: Awaited<ReturnType<typeof createCustomerValidator['validate']>>) {
    if (payload.customerType === 'COMPANY') {
      if (!payload.taxName || payload.taxName.trim().length < 2) {
        return 'Para tipo Empresa, la razón social es obligatoria'
      }

      if (!payload.taxNit || payload.taxNit.trim().length < 3) {
        return 'Para tipo Empresa, el NIT es obligatorio'
      }

      if (!payload.taxNrc || payload.taxNrc.trim().length < 3) {
        return 'Para tipo Empresa, el NRC es obligatorio'
      }
    }

    if (payload.customerType === 'INDIVIDUAL') {
      if (!payload.firstName || payload.firstName.trim().length < 2) {
        return 'Para tipo Persona natural, el nombre es obligatorio'
      }

      if (!payload.lastName || payload.lastName.trim().length < 2) {
        return 'Para tipo Persona natural, el apellido es obligatorio'
      }

      if (!payload.documentType) {
        return 'Para tipo Persona natural, el tipo de documento es obligatorio'
      }
    }

    return null
  }

  async index(ctx: HttpContext) {
    const rows = await Customer.query().preload('user').orderBy('id', 'asc')

    if (prefersHtml(ctx)) {
      return renderCatalogIndex(ctx, {
        pageKicker: 'Operación hotelera',
        pageTitle: 'Clientes',
        pageSubtitle: 'Base de clientes para reservas, check-in y facturación.',
        createHref: '/admin/hotels/customers/new',
        createLabel: 'Nuevo cliente',
        editBaseHref: '/admin/hotels/customers',
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'fullName', label: 'Nombre completo' },
          { key: 'customerType', label: 'Tipo', badge: true },
          { key: 'email', label: 'Email' },
          { key: 'isActive', label: 'Activo', badge: true },
        ],
        rows: rows.map((row) => ({
          id: row.id,
          fullName: row.fullName,
          customerType: customerTypeLabel(row.customerType),
          email: row.email ?? '-',
          isActive: row.isActive ? 'Sí' : 'No',
        })),
      })
    }

    const { response } = ctx
    return response.ok({ data: rows })
  }

  private async customerFields(): Promise<CatalogField[]> {
    const users = await User.query().orderBy('email', 'asc')
    return [
      {
        name: 'userId',
        label: 'Usuario vinculado',
        type: 'select',
        colSpanMd: 2,
        colSpanXl: 2,
        options: users.map((item) => ({ value: item.id, label: `${item.id} - ${item.email}` })),
      },
      {
        name: 'customerType',
        label: 'Tipo de cliente',
        type: 'select',
        required: true,
        options: customerTypeOptions,
        colSpanMd: 1,
        colSpanXl: 1,
      },
      {
        name: 'firstName',
        label: 'Nombre',
        showWhenField: 'customerType',
        showWhenValues: ['INDIVIDUAL'],
      },
      {
        name: 'lastName',
        label: 'Apellido',
        showWhenField: 'customerType',
        showWhenValues: ['INDIVIDUAL'],
      },
      {
        name: 'fullName',
        label: 'Nombre completo',
        required: true,
        colSpanMd: 2,
        colSpanXl: 2,
        readOnly: true,
        helpText: 'Se completa automáticamente según el tipo de cliente.',
      },
      {
        name: 'taxName',
        label: 'Razón social',
        colSpanMd: 2,
        colSpanXl: 2,
        showWhenField: 'customerType',
        showWhenValues: ['COMPANY'],
      },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'birthDate', label: 'Fecha nacimiento', type: 'date' },
      { name: 'nationality', label: 'Nacionalidad' },
      {
        name: 'documentType',
        label: 'Tipo de documento',
        type: 'select',
        options: documentTypeOptions,
        showWhenField: 'customerType',
        showWhenValues: ['INDIVIDUAL'],
      },
      { name: 'documentNumber', label: 'Número documento' },
      {
        name: 'taxNit',
        label: 'NIT',
        showWhenField: 'customerType',
        showWhenValues: ['COMPANY'],
      },
      {
        name: 'taxNrc',
        label: 'NRC',
        showWhenField: 'customerType',
        showWhenValues: ['COMPANY'],
      },
      { name: 'taxAddress', label: 'Dirección fiscal', type: 'textarea', fullWidth: true },
      { name: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
      { name: 'isActive', label: 'Activo', type: 'checkbox', colSpanMd: 2, colSpanXl: 1 },
    ]
  }

  async create(ctx: HttpContext) {
    return renderCatalogForm(ctx, {
      formMode: 'create',
      formKicker: 'Operación hotelera',
      formTitle: 'Nuevo cliente',
      formSubtitle: 'Registra huésped individual o empresa para operaciones de reserva.',
      formAction: '/admin/hotels/customers',
      submitLabel: 'Crear cliente',
      backHref: '/admin/hotels/customers',
      fields: await this.customerFields(),
      values: { customerType: 'INDIVIDUAL', isActive: true },
    })
  }

  async edit(ctx: HttpContext) {
    const row = await Customer.findOrFail(ctx.params.id)
    return renderCatalogForm(ctx, {
      formMode: 'edit',
      formKicker: 'Operación hotelera',
      formTitle: `Editar cliente #${row.id}`,
      formSubtitle: 'Actualiza identidad, documentos y datos de contacto.',
      formAction: `/admin/hotels/customers/${row.id}/update`,
      submitLabel: 'Guardar cambios',
      backHref: '/admin/hotels/customers',
      fields: await this.customerFields(),
      values: {
        userId: row.userId,
        customerType: row.customerType,
        firstName: row.firstName,
        lastName: row.lastName,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        birthDate: row.birthDate?.toISODate(),
        nationality: row.nationality,
        documentType: row.documentType,
        documentNumber: row.documentNumber,
        taxName: row.taxName,
        taxNit: row.taxNit,
        taxNrc: row.taxNrc,
        taxAddress: row.taxAddress,
        notes: row.notes,
        isActive: row.isActive,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { request } = ctx
    const payload = await request.validateUsing(createCustomerValidator)

    const customerTypeError = this.validateCustomerTypeFields(payload)
    if (customerTypeError) {
      return respondConflictOrRedirect(ctx, customerTypeError, '/admin/hotels/customers/new', 400)
    }

    if (payload.userId) {
      const linkedUser = await User.find(payload.userId)
      if (!linkedUser) {
        return respondConflictOrRedirect(ctx, 'userId no existe', '/admin/hotels/customers/new', 400)
      }

      const userTaken = await Customer.query().where('user_id', payload.userId).first()
      if (userTaken) {
        return respondConflictOrRedirect(ctx, 'userId ya esta vinculado a otro cliente', '/admin/hotels/customers/new')
      }
    }

    const row = await Customer.create({
      userId: payload.userId ?? null,
      customerType: payload.customerType as CustomerType,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      fullName: payload.fullName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      birthDate: payload.birthDate ? DateTime.fromJSDate(payload.birthDate) : null,
      nationality: payload.nationality ?? null,
      documentType: (payload.documentType as Customer['documentType']) ?? null,
      documentNumber: payload.documentNumber ?? null,
      taxName: payload.taxName ?? null,
      taxNit: payload.taxNit ?? null,
      taxNrc: payload.taxNrc ?? null,
      taxAddress: payload.taxAddress ?? null,
      notes: payload.notes ?? null,
      isActive: payload.isActive ?? true,
    })

    await AuditLogger.log(
      {
        action: 'CREATE',
        entity: 'customer',
        entityId: row.id,
        oldValues: null,
        newValues: {
          customerType: row.customerType,
          fullName: row.fullName,
          email: row.email,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.customers.store' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Cliente creado', '/admin/hotels/customers', row, true)
  }

  async update(ctx: HttpContext) {
    const { params, request } = ctx
    const row = await Customer.findOrFail(params.id)
    const payload = await request.validateUsing(createCustomerValidator)

    const customerTypeError = this.validateCustomerTypeFields(payload)
    if (customerTypeError) {
      return respondConflictOrRedirect(ctx, customerTypeError, `/admin/hotels/customers/${row.id}/edit`, 400)
    }

    if (payload.userId) {
      const linkedUser = await User.find(payload.userId)
      if (!linkedUser) {
        return respondConflictOrRedirect(ctx, 'userId no existe', `/admin/hotels/customers/${row.id}/edit`, 400)
      }

      const userTaken = await Customer.query().where('user_id', payload.userId).whereNot('id', row.id).first()
      if (userTaken) {
        return respondConflictOrRedirect(
          ctx,
          'userId ya esta vinculado a otro cliente',
          `/admin/hotels/customers/${row.id}/edit`
        )
      }
    }

    const previous = {
      customerType: row.customerType,
      fullName: row.fullName,
      email: row.email,
      isActive: row.isActive,
    }

    row.userId = payload.userId ?? null
    row.customerType = payload.customerType as CustomerType
    row.firstName = payload.firstName ?? null
    row.lastName = payload.lastName ?? null
    row.fullName = payload.fullName
    row.email = payload.email ?? null
    row.phone = payload.phone ?? null
    row.birthDate = payload.birthDate ? DateTime.fromJSDate(payload.birthDate) : null
    row.nationality = payload.nationality ?? null
    row.documentType = (payload.documentType as Customer['documentType']) ?? null
    row.documentNumber = payload.documentNumber ?? null
    row.taxName = payload.taxName ?? null
    row.taxNit = payload.taxNit ?? null
    row.taxNrc = payload.taxNrc ?? null
    row.taxAddress = payload.taxAddress ?? null
    row.notes = payload.notes ?? null
    row.isActive = payload.isActive ?? row.isActive
    await row.save()

    await AuditLogger.log(
      {
        action: 'UPDATE',
        entity: 'customer',
        entityId: row.id,
        oldValues: previous,
        newValues: {
          customerType: row.customerType,
          fullName: row.fullName,
          email: row.email,
          isActive: row.isActive,
        },
        metadata: { source: 'admin.hotels.customers.update' },
      },
      ctx
    )

    return respondSuccessOrJson(ctx, 'Cliente actualizado', '/admin/hotels/customers', row)
  }
}
