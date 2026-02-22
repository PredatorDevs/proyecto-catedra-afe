import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('roles', (table) => {
      table.increments('id').notNullable()
      table.string('slug', 100).notNullable().unique()
      table.string('name', 120).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('permissions', (table) => {
      table.increments('id').notNullable()
      table.string('slug', 120).notNullable().unique()
      table.string('name', 160).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('user_roles', (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('users.id')
        .onDelete('CASCADE')
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('roles.id')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable()

      table.unique(['user_id', 'role_id'])
    })

    this.schema.createTable('role_permissions', (table) => {
      table.increments('id').notNullable()
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('roles.id')
        .onDelete('CASCADE')
      table
        .integer('permission_id')
        .unsigned()
        .notNullable()
        .references('permissions.id')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable()

      table.unique(['role_id', 'permission_id'])
    })
  }

  async down() {
    this.schema.dropTable('role_permissions')
    this.schema.dropTable('user_roles')
    this.schema.dropTable('permissions')
    this.schema.dropTable('roles')
  }
}
