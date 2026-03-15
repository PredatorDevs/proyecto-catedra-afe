import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('request_id', 120).nullable()
      table.json('old_values').nullable()
      table.json('new_values').nullable()
      table.json('changed_fields').nullable()

      table.index(['entity', 'entity_id'], 'audit_logs_entity_entity_id_idx')
      table.index(['action'], 'audit_logs_action_idx')
      table.index(['created_at'], 'audit_logs_created_at_idx')
      table.index(['request_id'], 'audit_logs_request_id_idx')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['entity', 'entity_id'], 'audit_logs_entity_entity_id_idx')
      table.dropIndex(['action'], 'audit_logs_action_idx')
      table.dropIndex(['created_at'], 'audit_logs_created_at_idx')
      table.dropIndex(['request_id'], 'audit_logs_request_id_idx')

      table.dropColumn('changed_fields')
      table.dropColumn('new_values')
      table.dropColumn('old_values')
      table.dropColumn('request_id')
    })
  }
}
