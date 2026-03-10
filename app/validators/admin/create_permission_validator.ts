import vine from '@vinejs/vine'

export const createPermissionValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().minLength(2).maxLength(120).unique({ table: 'permissions', column: 'slug' }),
    name: vine.string().trim().minLength(2).maxLength(160),
  })
)
