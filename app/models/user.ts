import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Role from '#models/role'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => Role, {
    pivotTable: 'user_roles',
  })
  declare roles: ManyToMany<typeof Role>

  async hasPermission(permissionSlug: string): Promise<boolean> {
    const result = await Role.query()
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .join('permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('user_roles.user_id', this.id)
      .where('permissions.slug', permissionSlug)
      .limit(1)

    return result.length > 0
  }

  can(permissionSlug: string): Promise<boolean> {
    return this.hasPermission(permissionSlug)
  }
}