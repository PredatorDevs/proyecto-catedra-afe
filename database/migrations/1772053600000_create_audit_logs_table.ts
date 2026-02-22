import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.string('action', 120).notNullable()
      table.string('entity', 120).notNullable()
      table.string('entity_id', 120).nullable()
      table.string('ip', 45).nullable()
      table.string('user_agent', 512).nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
