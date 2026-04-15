# Fase 3 - Pagos, Caja y Fiscal

## Estado
Implementada a nivel base (DDL + migracion + modelos + validadores + controladores admin iniciales).

## Objetivo de la fase
Incorporar el bloque transaccional y fiscal del sistema hotelero:
- caja y turnos
- pagos de reservacion
- comprobantes de pago
- transacciones registradas
- asignaciones de pago
- documentos fiscales

## Politica operativa definida para esta fase
No se integran pasarelas de pago en esta etapa.
Todos los pagos se registran manualmente con la informacion requerida del cliente.

## Tablas incluidas en Fase 3
- `payment_methods`
- `cashier_shifts`
- `payments`
- `payment_proofs`
- `payment_transactions`
- `payment_reservation_allocations`
- `payment_charge_allocations`
- `fiscal_documents`
- `fiscal_document_items`
- `fiscal_document_payments`

## DDL involucrado (implementado)

```sql
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `name` varchar(120) NOT NULL,
  `requires_reference` tinyint(1) NOT NULL DEFAULT 0,
  `requires_proof` tinyint(1) NOT NULL DEFAULT 0,
  `is_cash` tinyint(1) NOT NULL DEFAULT 0,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_methods_code_unique` (`code`),
  KEY `payment_methods_is_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `cashier_shifts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `shift_number` varchar(40) NOT NULL,
  `opened_by_user_id` int unsigned NOT NULL,
  `closed_by_user_id` int unsigned DEFAULT NULL,
  `status` enum('OPEN','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  `opened_at` datetime NOT NULL,
  `closed_at` datetime DEFAULT NULL,
  `opening_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `expected_cash_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `actual_cash_amount` decimal(12,2) DEFAULT NULL,
  `difference_amount` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cashier_shifts_shift_number_unique` (`shift_number`),
  KEY `cashier_shifts_opened_by_user_id_foreign` (`opened_by_user_id`),
  KEY `cashier_shifts_closed_by_user_id_foreign` (`closed_by_user_id`),
  KEY `cashier_shifts_status_idx` (`status`),
  KEY `cashier_shifts_opened_at_idx` (`opened_at`),
  CONSTRAINT `cashier_shifts_opened_by_user_id_foreign`
    FOREIGN KEY (`opened_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `cashier_shifts_closed_by_user_id_foreign`
    FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_cashier_shifts_amounts` CHECK (
    `opening_amount` >= 0 AND
    `expected_cash_amount` >= 0 AND
    (`actual_cash_amount` IS NULL OR `actual_cash_amount` >= 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `payment_number` varchar(40) NOT NULL,
  `reservation_id` int unsigned NOT NULL,
  `payment_method_id` int unsigned NOT NULL,
  `cashier_shift_id` int unsigned DEFAULT NULL,
  `parent_payment_id` int unsigned DEFAULT NULL,
  `payment_category` enum('LODGING','ADDITIONAL_CHARGES','MIXED','REFUND','REVERSAL') NOT NULL DEFAULT 'LODGING',
  `status` enum('PENDING','REPORTED','UNDER_REVIEW','APPROVED','REJECTED','VOIDED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `currency_code` char(3) NOT NULL DEFAULT 'USD',
  `amount` decimal(12,2) NOT NULL,
  `reference_number` varchar(120) DEFAULT NULL,
  `receipt_number` varchar(120) DEFAULT NULL,
  `reported_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `voided_at` datetime DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `recorded_by_user_id` int unsigned DEFAULT NULL,
  `approved_by_user_id` int unsigned DEFAULT NULL,
  `voided_by_user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_payment_number_unique` (`payment_number`),
  KEY `payments_reservation_id_foreign` (`reservation_id`),
  KEY `payments_payment_method_id_foreign` (`payment_method_id`),
  KEY `payments_cashier_shift_id_foreign` (`cashier_shift_id`),
  KEY `payments_parent_payment_id_foreign` (`parent_payment_id`),
  KEY `payments_status_idx` (`status`),
  KEY `payments_paid_at_idx` (`paid_at`),
  CONSTRAINT `payments_reservation_id_foreign`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `payments_payment_method_id_foreign`
    FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `payments_cashier_shift_id_foreign`
    FOREIGN KEY (`cashier_shift_id`) REFERENCES `cashier_shifts` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `payments_parent_payment_id_foreign`
    FOREIGN KEY (`parent_payment_id`) REFERENCES `payments` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `payments_recorded_by_user_id_foreign`
    FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `payments_approved_by_user_id_foreign`
    FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `payments_voided_by_user_id_foreign`
    FOREIGN KEY (`voided_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_payments_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_proofs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int unsigned NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size_bytes` bigint unsigned DEFAULT NULL,
  `validation_status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `uploaded_by_user_id` int unsigned DEFAULT NULL,
  `validated_by_user_id` int unsigned DEFAULT NULL,
  `validated_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_proofs_payment_id_foreign` (`payment_id`),
  KEY `payment_proofs_validation_status_idx` (`validation_status`),
  CONSTRAINT `payment_proofs_payment_id_foreign`
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `payment_proofs_uploaded_by_user_id_foreign`
    FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `payment_proofs_validated_by_user_id_foreign`
    FOREIGN KEY (`validated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int unsigned NOT NULL,
  `provider` varchar(80) NOT NULL,
  `external_transaction_id` varchar(120) DEFAULT NULL,
  `authorization_code` varchar(120) DEFAULT NULL,
  `transaction_status` varchar(80) NOT NULL,
  `request_payload` json DEFAULT NULL,
  `response_payload` json DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_transactions_external_transaction_id_unique` (`external_transaction_id`),
  KEY `payment_transactions_payment_id_foreign` (`payment_id`),
  KEY `payment_transactions_provider_idx` (`provider`),
  KEY `payment_transactions_transaction_status_idx` (`transaction_status`),
  CONSTRAINT `payment_transactions_payment_id_foreign`
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_reservation_allocations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int unsigned NOT NULL,
  `reservation_id` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_reservation_allocations_payment_reservation_unique` (`payment_id`,`reservation_id`),
  KEY `payment_reservation_allocations_reservation_id_foreign` (`reservation_id`),
  CONSTRAINT `payment_reservation_allocations_payment_id_foreign`
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `payment_reservation_allocations_reservation_id_foreign`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_payment_reservation_allocations_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_charge_allocations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int unsigned NOT NULL,
  `reservation_charge_id` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_charge_allocations_payment_charge_unique` (`payment_id`,`reservation_charge_id`),
  KEY `payment_charge_allocations_reservation_charge_id_foreign` (`reservation_charge_id`),
  CONSTRAINT `payment_charge_allocations_payment_id_foreign`
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `payment_charge_allocations_reservation_charge_id_foreign`
    FOREIGN KEY (`reservation_charge_id`) REFERENCES `reservation_charges` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_payment_charge_allocations_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fiscal_documents` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `reservation_id` int unsigned NOT NULL,
  `customer_id` int unsigned NOT NULL,
  `document_type` enum('CONSUMER_FINAL','CREDITO_FISCAL','NOTA_CREDITO','ANULACION') NOT NULL,
  `document_number` varchar(60) NOT NULL,
  `status` enum('PENDING','ISSUED','VOIDED','ERROR') NOT NULL DEFAULT 'PENDING',
  `currency_code` char(3) NOT NULL DEFAULT 'USD',
  `customer_name_snapshot` varchar(255) NOT NULL,
  `customer_document_snapshot` varchar(60) DEFAULT NULL,
  `tax_name_snapshot` varchar(255) DEFAULT NULL,
  `tax_nit_snapshot` varchar(30) DEFAULT NULL,
  `tax_nrc_snapshot` varchar(30) DEFAULT NULL,
  `tax_address_snapshot` varchar(500) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `iva_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tourism_tax_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `issued_at` datetime DEFAULT NULL,
  `generated_by_user_id` int unsigned DEFAULT NULL,
  `voided_by_user_id` int unsigned DEFAULT NULL,
  `voided_at` datetime DEFAULT NULL,
  `void_reason` text DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_documents_document_number_unique` (`document_number`),
  KEY `fiscal_documents_reservation_id_foreign` (`reservation_id`),
  KEY `fiscal_documents_customer_id_foreign` (`customer_id`),
  KEY `fiscal_documents_document_type_idx` (`document_type`),
  KEY `fiscal_documents_status_idx` (`status`),
  CONSTRAINT `fiscal_documents_reservation_id_foreign`
    FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fiscal_documents_customer_id_foreign`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fiscal_documents_generated_by_user_id_foreign`
    FOREIGN KEY (`generated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fiscal_documents_voided_by_user_id_foreign`
    FOREIGN KEY (`voided_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_fiscal_documents_amounts` CHECK (
    `subtotal` >= 0 AND
    `iva_total` >= 0 AND
    `tourism_tax_total` >= 0 AND
    `total_amount` >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fiscal_document_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_document_id` int unsigned NOT NULL,
  `reservation_charge_id` int unsigned DEFAULT NULL,
  `item_type` enum('LODGING','ADDITIONAL_CHARGE','ADJUSTMENT') NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `iva_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tourism_tax_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fiscal_document_items_fiscal_document_id_foreign` (`fiscal_document_id`),
  KEY `fiscal_document_items_reservation_charge_id_foreign` (`reservation_charge_id`),
  CONSTRAINT `fiscal_document_items_fiscal_document_id_foreign`
    FOREIGN KEY (`fiscal_document_id`) REFERENCES `fiscal_documents` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fiscal_document_items_reservation_charge_id_foreign`
    FOREIGN KEY (`reservation_charge_id`) REFERENCES `reservation_charges` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_fiscal_document_items_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_fiscal_document_items_amounts` CHECK (
    `unit_price` >= 0 AND
    `subtotal` >= 0 AND
    `iva_total` >= 0 AND
    `tourism_tax_total` >= 0 AND
    `total_amount` >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fiscal_document_payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_document_id` int unsigned NOT NULL,
  `payment_id` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_document_payments_document_payment_unique` (`fiscal_document_id`,`payment_id`),
  KEY `fiscal_document_payments_payment_id_foreign` (`payment_id`),
  CONSTRAINT `fiscal_document_payments_fiscal_document_id_foreign`
    FOREIGN KEY (`fiscal_document_id`) REFERENCES `fiscal_documents` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fiscal_document_payments_payment_id_foreign`
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_fiscal_document_payments_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## Artefactos implementados

### Migracion
- `database/migrations/1775000000000_create_hotels_phase3_payments_cashier_fiscal_tables.ts`

### Modelos
- `app/models/payment_method.ts`
- `app/models/cashier_shift.ts`
- `app/models/payment.ts`
- `app/models/payment_proof.ts`
- `app/models/payment_transaction.ts`
- `app/models/payment_reservation_allocation.ts`
- `app/models/payment_charge_allocation.ts`
- `app/models/fiscal_document.ts`
- `app/models/fiscal_document_item.ts`
- `app/models/fiscal_document_payment.ts`

### Validadores
- `app/validators/admin/hotels/create_payment_method_validator.ts`
- `app/validators/admin/hotels/create_cashier_shift_validator.ts`
- `app/validators/admin/hotels/create_payment_validator.ts`
- `app/validators/admin/hotels/create_fiscal_document_validator.ts`
- `app/validators/admin/hotels/create_payment_proof_validator.ts`
- `app/validators/admin/hotels/create_payment_transaction_validator.ts`
- `app/validators/admin/hotels/create_payment_reservation_allocation_validator.ts`
- `app/validators/admin/hotels/create_payment_charge_allocation_validator.ts`

### Controladores
- `app/controllers/admin/hotels/payment_methods_controller.ts`
- `app/controllers/admin/hotels/cashier_shifts_controller.ts`
- `app/controllers/admin/hotels/payments_controller.ts`
- `app/controllers/admin/hotels/fiscal_documents_controller.ts`
- `app/controllers/admin/hotels/payment_proofs_controller.ts`
- `app/controllers/admin/hotels/payment_transactions_controller.ts`
- `app/controllers/admin/hotels/payment_reservation_allocations_controller.ts`
- `app/controllers/admin/hotels/payment_charge_allocations_controller.ts`

### Rutas admin
- `/admin/hotels/payment-methods` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/cashier-shifts` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/payments` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/fiscal-documents` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/payment-proofs` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/payment-transactions` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/payment-reservation-allocations` (`index`, `create`, `edit`, `store`, `update`)
- `/admin/hotels/payment-charge-allocations` (`index`, `create`, `edit`, `store`, `update`)

### Seeders
- `database/seeders/04_payment_methods_seeder.ts`

### Pruebas funcionales
- `tests/functional/hotels_phase3_payments.spec.ts`

## Reglas operativas implementadas (base)
- Pagos registrados de forma manual; sin pasarela integrada.
- Metodo de pago con `requires_reference` exige referencia al registrar pago.
- Pagos en efectivo exigen turno de caja abierto.
- Transiciones de estado de pago restringidas para evitar saltos invalidos.
- Al aprobar/revertir/anular pagos se sincronizan `amount_paid` y `balance_due` en reservacion.
- `externalTransactionId` de transaccion de pago es unico.
- Asignaciones a reservacion/cargo no pueden superar el monto total del pago.
- Asignaciones duplicadas para la misma combinacion (`payment_id` + destino) se bloquean.

## Orden recomendado de rollback
1. `fiscal_document_payments`
2. `fiscal_document_items`
3. `fiscal_documents`
4. `payment_charge_allocations`
5. `payment_reservation_allocations`
6. `payment_transactions`
7. `payment_proofs`
8. `payments`
9. `cashier_shifts`
10. `payment_methods`
