import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  private async ensureIndex(indexName: string, columns: string) {
    try {
      await this.db.rawQuery(`CREATE INDEX \`${indexName}\` ON \`${this.tableName}\` (${columns})`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('Duplicate key name')) {
        throw error
      }
    }
  }

  private async dropIndexIfExists(indexName: string) {
    try {
      await this.db.rawQuery(`DROP INDEX \`${indexName}\` ON \`${this.tableName}\``)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes("Can't DROP") && !message.includes('check that column/key exists')) {
        throw error
      }
    }
  }

  async up() {
    const hasRequestId = await this.schema.hasColumn(this.tableName, 'request_id')
    const hasOldValues = await this.schema.hasColumn(this.tableName, 'old_values')
    const hasNewValues = await this.schema.hasColumn(this.tableName, 'new_values')
    const hasChangedFields = await this.schema.hasColumn(this.tableName, 'changed_fields')

    if (!hasRequestId || !hasOldValues || !hasNewValues || !hasChangedFields) {
      this.schema.alterTable(this.tableName, (table) => {
        if (!hasRequestId) table.string('request_id', 120).nullable()
        if (!hasOldValues) table.json('old_values').nullable()
        if (!hasNewValues) table.json('new_values').nullable()
        if (!hasChangedFields) table.json('changed_fields').nullable()
      })
    }

    await this.ensureIndex('audit_logs_entity_entity_id_idx', '`entity`, `entity_id`')
    await this.ensureIndex('audit_logs_action_idx', '`action`')
    await this.ensureIndex('audit_logs_created_at_idx', '`created_at`')
    await this.ensureIndex('audit_logs_request_id_idx', '`request_id`')
  }

  async down() {
    await this.dropIndexIfExists('audit_logs_entity_entity_id_idx')
    await this.dropIndexIfExists('audit_logs_action_idx')
    await this.dropIndexIfExists('audit_logs_created_at_idx')
    await this.dropIndexIfExists('audit_logs_request_id_idx')

    const hasRequestId = await this.schema.hasColumn(this.tableName, 'request_id')
    const hasOldValues = await this.schema.hasColumn(this.tableName, 'old_values')
    const hasNewValues = await this.schema.hasColumn(this.tableName, 'new_values')
    const hasChangedFields = await this.schema.hasColumn(this.tableName, 'changed_fields')

    if (hasRequestId || hasOldValues || hasNewValues || hasChangedFields) {
      this.schema.alterTable(this.tableName, (table) => {
        if (hasChangedFields) table.dropColumn('changed_fields')
        if (hasNewValues) table.dropColumn('new_values')
        if (hasOldValues) table.dropColumn('old_values')
        if (hasRequestId) table.dropColumn('request_id')
      })
    }
  }
}
