import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.schema.raw(`
      CREATE TABLE IF NOT EXISTS \`reservations\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`reservation_number\` varchar(40) NOT NULL,
        \`customer_id\` int unsigned NOT NULL,
        \`room_type_id\` int unsigned NOT NULL,
        \`room_id\` int unsigned DEFAULT NULL,
        \`applied_room_price_id\` int unsigned DEFAULT NULL,
        \`source\` enum('WEB','RECEPTION','PHONE','WALK_IN','OTHER') NOT NULL DEFAULT 'WEB',
        \`status\` enum(
          'DRAFT',
          'PENDING_ADMIN_CONFIRMATION',
          'PENDING_PAYMENT',
          'PAYMENT_UNDER_REVIEW',
          'CONFIRMED',
          'CHECKED_IN',
          'CHECKED_OUT',
          'CANCELLED',
          'EXPIRED',
          'NO_SHOW',
          'REFUND_PENDING',
          'REFUNDED'
        ) NOT NULL DEFAULT 'DRAFT',
        \`adults_count\` smallint unsigned NOT NULL DEFAULT 1,
        \`children_count\` smallint unsigned NOT NULL DEFAULT 0,
        \`guests_count\` smallint unsigned NOT NULL DEFAULT 1,
        \`check_in_planned_at\` datetime NOT NULL,
        \`check_out_planned_at\` datetime NOT NULL,
        \`check_in_deadline_at\` datetime DEFAULT NULL,
        \`expires_at\` datetime DEFAULT NULL,
        \`confirmed_at\` datetime DEFAULT NULL,
        \`cancelled_at\` datetime DEFAULT NULL,
        \`checked_in_at\` datetime DEFAULT NULL,
        \`checked_out_at\` datetime DEFAULT NULL,
        \`lodging_subtotal\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`discount_total\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`iva_total\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`tourism_tax_total\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`total_amount\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`amount_paid\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`balance_due\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`special_requests\` text DEFAULT NULL,
        \`internal_notes\` text DEFAULT NULL,
        \`cancellation_reason\` text DEFAULT NULL,
        \`cancelled_by_user_id\` int unsigned DEFAULT NULL,
        \`created_by_user_id\` int unsigned DEFAULT NULL,
        \`updated_by_user_id\` int unsigned DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`reservations_reservation_number_unique\` (\`reservation_number\`),
        KEY \`reservations_customer_id_foreign\` (\`customer_id\`),
        KEY \`reservations_room_type_id_foreign\` (\`room_type_id\`),
        KEY \`reservations_room_id_foreign\` (\`room_id\`),
        KEY \`reservations_applied_room_price_id_foreign\` (\`applied_room_price_id\`),
        KEY \`reservations_status_idx\` (\`status\`),
        KEY \`reservations_source_idx\` (\`source\`),
        KEY \`reservations_dates_idx\` (\`check_in_planned_at\`,\`check_out_planned_at\`),
        KEY \`reservations_room_dates_idx\` (\`room_id\`,\`check_in_planned_at\`,\`check_out_planned_at\`),
        CONSTRAINT \`reservations_customer_id_foreign\`
          FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`)
          ON DELETE RESTRICT,
        CONSTRAINT \`reservations_room_type_id_foreign\`
          FOREIGN KEY (\`room_type_id\`) REFERENCES \`room_types\` (\`id\`)
          ON DELETE RESTRICT,
        CONSTRAINT \`reservations_room_id_foreign\`
          FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`reservations_applied_room_price_id_foreign\`
          FOREIGN KEY (\`applied_room_price_id\`) REFERENCES \`room_prices\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`reservations_cancelled_by_user_id_foreign\`
          FOREIGN KEY (\`cancelled_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`reservations_created_by_user_id_foreign\`
          FOREIGN KEY (\`created_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`reservations_updated_by_user_id_foreign\`
          FOREIGN KEY (\`updated_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`chk_reservations_dates\` CHECK (\`check_out_planned_at\` > \`check_in_planned_at\`),
        CONSTRAINT \`chk_reservations_guest_counts\` CHECK (\`guests_count\` >= 1 AND \`adults_count\` >= 1),
        CONSTRAINT \`chk_reservations_amounts\` CHECK (
          \`lodging_subtotal\` >= 0 AND
          \`discount_total\` >= 0 AND
          \`iva_total\` >= 0 AND
          \`tourism_tax_total\` >= 0 AND
          \`total_amount\` >= 0 AND
          \`amount_paid\` >= 0 AND
          \`balance_due\` >= 0
        )
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `)

    await this.schema.raw(`
      CREATE TABLE IF NOT EXISTS \`reservation_guests\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`reservation_id\` int unsigned NOT NULL,
        \`guest_type\` enum('PRIMARY','ADDITIONAL') NOT NULL DEFAULT 'ADDITIONAL',
        \`full_name\` varchar(255) NOT NULL,
        \`email\` varchar(254) DEFAULT NULL,
        \`phone\` varchar(30) DEFAULT NULL,
        \`document_type\` enum('DUI','PASSPORT','NIT','OTHER') DEFAULT NULL,
        \`document_number\` varchar(50) DEFAULT NULL,
        \`is_responsible\` tinyint(1) NOT NULL DEFAULT 0,
        \`notes\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`reservation_guests_reservation_id_foreign\` (\`reservation_id\`),
        KEY \`reservation_guests_document_idx\` (\`document_type\`,\`document_number\`),
        CONSTRAINT \`reservation_guests_reservation_id_foreign\`
          FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservations\` (\`id\`)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `)

    await this.schema.raw(`
      CREATE TABLE IF NOT EXISTS \`checkin_checkout_logs\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`reservation_id\` int unsigned NOT NULL,
        \`room_id\` int unsigned DEFAULT NULL,
        \`action\` enum('CHECK_IN','CHECK_OUT','ROOM_CHANGE_OUT','ROOM_CHANGE_IN','NO_SHOW') NOT NULL,
        \`performed_by_user_id\` int unsigned DEFAULT NULL,
        \`occurred_at\` datetime NOT NULL,
        \`notes\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`checkin_checkout_logs_reservation_id_foreign\` (\`reservation_id\`),
        KEY \`checkin_checkout_logs_room_id_foreign\` (\`room_id\`),
        KEY \`checkin_checkout_logs_performed_by_user_id_foreign\` (\`performed_by_user_id\`),
        KEY \`checkin_checkout_logs_action_idx\` (\`action\`),
        KEY \`checkin_checkout_logs_occurred_at_idx\` (\`occurred_at\`),
        CONSTRAINT \`checkin_checkout_logs_reservation_id_foreign\`
          FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservations\` (\`id\`)
          ON DELETE CASCADE,
        CONSTRAINT \`checkin_checkout_logs_room_id_foreign\`
          FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`checkin_checkout_logs_performed_by_user_id_foreign\`
          FOREIGN KEY (\`performed_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `)

    await this.schema.raw(`
      CREATE TABLE IF NOT EXISTS \`reservation_charges\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`reservation_id\` int unsigned NOT NULL,
        \`charge_catalog_id\` int unsigned DEFAULT NULL,
        \`charge_kind\` enum('PRODUCT','SERVICE','PENALTY','EXTRA_GUEST','OTHER') NOT NULL DEFAULT 'SERVICE',
        \`charge_status\` enum('PENDING','PAID','BILLED','VOIDED') NOT NULL DEFAULT 'PENDING',
        \`concept\` varchar(255) NOT NULL,
        \`quantity\` decimal(12,2) NOT NULL DEFAULT 1.00,
        \`unit_price\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`subtotal\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`iva_total\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`tourism_tax_total\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`total_amount\` decimal(12,2) NOT NULL DEFAULT 0.00,
        \`consumed_at\` datetime DEFAULT NULL,
        \`added_by_user_id\` int unsigned DEFAULT NULL,
        \`voided_by_user_id\` int unsigned DEFAULT NULL,
        \`void_reason\` text DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`reservation_charges_reservation_id_foreign\` (\`reservation_id\`),
        KEY \`reservation_charges_charge_catalog_id_foreign\` (\`charge_catalog_id\`),
        KEY \`reservation_charges_charge_status_idx\` (\`charge_status\`),
        KEY \`reservation_charges_consumed_at_idx\` (\`consumed_at\`),
        CONSTRAINT \`reservation_charges_reservation_id_foreign\`
          FOREIGN KEY (\`reservation_id\`) REFERENCES \`reservations\` (\`id\`)
          ON DELETE CASCADE,
        CONSTRAINT \`reservation_charges_charge_catalog_id_foreign\`
          FOREIGN KEY (\`charge_catalog_id\`) REFERENCES \`additional_charge_catalog\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`reservation_charges_added_by_user_id_foreign\`
          FOREIGN KEY (\`added_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`reservation_charges_voided_by_user_id_foreign\`
          FOREIGN KEY (\`voided_by_user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL,
        CONSTRAINT \`chk_reservation_charges_quantity\` CHECK (\`quantity\` > 0),
        CONSTRAINT \`chk_reservation_charges_amounts\` CHECK (
          \`unit_price\` >= 0 AND
          \`subtotal\` >= 0 AND
          \`iva_total\` >= 0 AND
          \`tourism_tax_total\` >= 0 AND
          \`total_amount\` >= 0
        )
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `)
  }

  async down() {
    await this.schema.raw('DROP TABLE IF EXISTS `reservation_charges`;')
    await this.schema.raw('DROP TABLE IF EXISTS `checkin_checkout_logs`;')
    await this.schema.raw('DROP TABLE IF EXISTS `reservation_guests`;')
    await this.schema.raw('DROP TABLE IF EXISTS `reservations`;')
  }
}
