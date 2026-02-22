import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().unique({ table: 'users', column: 'email' }),
    password: vine.string().minLength(8),
  })
)