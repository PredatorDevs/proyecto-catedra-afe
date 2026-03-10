import vine from '@vinejs/vine'

export const createRoleValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().minLength(2).maxLength(100).unique({ table: 'roles', column: 'slug' }),
    name: vine.string().trim().minLength(2).maxLength(120),
  })
)
