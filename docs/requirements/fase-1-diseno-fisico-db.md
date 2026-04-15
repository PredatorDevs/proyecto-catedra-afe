# Fase 1 - Diseno Fisico de Base de Datos (Hoteles y Reservas)

## Estado
Aprobado como base tecnica inicial para implementacion en migraciones de AdonisJS + MySQL.

## Objetivo de la fase
Definir e implementar las estructuras base del dominio hotelero para:
- clientes
- tipos de habitacion
- habitaciones
- imagenes de habitaciones
- temporadas
- precios de habitaciones
- catalogo de cargos adicionales

## Tablas incluidas en Fase 1
- `customers`
- `room_types`
- `rooms`
- `room_images`
- `seasons`
- `room_prices`
- `additional_charge_catalog`

## DDL base definido

```sql
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `customer_code` varchar(30) DEFAULT NULL,
  `customer_type` enum('INDIVIDUAL','COMPANY') NOT NULL DEFAULT 'INDIVIDUAL',
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(254) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `document_type` enum('DUI','PASSPORT','NIT','OTHER') DEFAULT NULL,
  `document_number` varchar(50) DEFAULT NULL,
  `tax_name` varchar(255) DEFAULT NULL,
  `tax_nit` varchar(30) DEFAULT NULL,
  `tax_nrc` varchar(30) DEFAULT NULL,
  `tax_address` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_customer_code_unique` (`customer_code`),
  UNIQUE KEY `customers_user_id_unique` (`user_id`),
  KEY `customers_full_name_idx` (`full_name`),
  KEY `customers_email_idx` (`email`),
  KEY `customers_document_idx` (`document_type`,`document_number`),
  CONSTRAINT `customers_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `room_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `base_capacity` smallint unsigned NOT NULL DEFAULT 1,
  `max_capacity` smallint unsigned NOT NULL DEFAULT 1,
  `bed_type` varchar(100) DEFAULT NULL,
  `bed_count` smallint unsigned NOT NULL DEFAULT 1,
  `has_private_bathroom` tinyint(1) NOT NULL DEFAULT 1,
  `default_nightly_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `updated_by_user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_types_code_unique` (`code`),
  KEY `room_types_is_active_idx` (`is_active`),
  CONSTRAINT `room_types_created_by_user_id_foreign`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `room_types_updated_by_user_id_foreign`
    FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_room_types_capacity` CHECK (`max_capacity` >= `base_capacity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_type_id` int unsigned NOT NULL,
  `room_number` varchar(20) NOT NULL,
  `name` varchar(120) DEFAULT NULL,
  `floor_number` smallint DEFAULT NULL,
  `current_status` enum(
    'AVAILABLE_CLEAN',
    'RESERVED',
    'OCCUPIED',
    'DIRTY',
    'CLEANING_IN_PROGRESS',
    'INSPECTED',
    'BLOCKED',
    'MAINTENANCE',
    'OUT_OF_SERVICE'
  ) NOT NULL DEFAULT 'AVAILABLE_CLEAN',
  `is_smoking_allowed` tinyint(1) NOT NULL DEFAULT 0,
  `internal_notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `updated_by_user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_room_number_unique` (`room_number`),
  KEY `rooms_room_type_id_foreign` (`room_type_id`),
  KEY `rooms_current_status_idx` (`current_status`),
  KEY `rooms_is_active_idx` (`is_active`),
  CONSTRAINT `rooms_room_type_id_foreign`
    FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `rooms_created_by_user_id_foreign`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `rooms_updated_by_user_id_foreign`
    FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `room_images` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT 0,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_images_room_id_foreign` (`room_id`),
  KEY `room_images_sort_order_idx` (`sort_order`),
  CONSTRAINT `room_images_room_id_foreign`
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `seasons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `name` varchar(120) NOT NULL,
  `season_type` enum('HIGH','LOW','PROMOTIONAL','SPECIAL') NOT NULL DEFAULT 'SPECIAL',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `priority` smallint unsigned NOT NULL DEFAULT 100,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `updated_by_user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seasons_code_unique` (`code`),
  KEY `seasons_dates_idx` (`starts_at`,`ends_at`),
  CONSTRAINT `seasons_created_by_user_id_foreign`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `seasons_updated_by_user_id_foreign`
    FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_seasons_dates` CHECK (`ends_at` > `starts_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `room_prices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_type_id` int unsigned NOT NULL,
  `room_id` int unsigned DEFAULT NULL,
  `season_id` int unsigned DEFAULT NULL,
  `name` varchar(160) NOT NULL,
  `pricing_scope` enum('ROOM_TYPE','ROOM') NOT NULL DEFAULT 'ROOM_TYPE',
  `price_basis` enum('NIGHT','STAY') NOT NULL DEFAULT 'NIGHT',
  `valid_from` datetime NOT NULL,
  `valid_to` datetime NOT NULL,
  `days_of_week_mask` char(7) NOT NULL DEFAULT '1111111',
  `base_price` decimal(12,2) NOT NULL,
  `extra_guest_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `priority` smallint unsigned NOT NULL DEFAULT 100,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `updated_by_user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_prices_room_type_id_foreign` (`room_type_id`),
  KEY `room_prices_room_id_foreign` (`room_id`),
  KEY `room_prices_season_id_foreign` (`season_id`),
  KEY `room_prices_validity_idx` (`valid_from`,`valid_to`,`is_active`),
  KEY `room_prices_priority_idx` (`priority`),
  CONSTRAINT `room_prices_room_type_id_foreign`
    FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `room_prices_room_id_foreign`
    FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `room_prices_season_id_foreign`
    FOREIGN KEY (`season_id`) REFERENCES `seasons` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `room_prices_created_by_user_id_foreign`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `room_prices_updated_by_user_id_foreign`
    FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_room_prices_dates` CHECK (`valid_to` > `valid_from`),
  CONSTRAINT `chk_room_prices_amounts` CHECK (`base_price` >= 0 AND `extra_guest_price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `additional_charge_catalog` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `charge_code` varchar(40) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `charge_kind` enum('PRODUCT','SERVICE','PENALTY','EXTRA_GUEST','OTHER') NOT NULL DEFAULT 'SERVICE',
  `unit_of_measure` enum('UNIT','DAY','HOUR','PERSON','SERVICE') NOT NULL DEFAULT 'UNIT',
  `unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `applies_iva` tinyint(1) NOT NULL DEFAULT 1,
  `applies_tourism_tax` tinyint(1) NOT NULL DEFAULT 0,
  `allow_manual_price` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `updated_by_user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `additional_charge_catalog_charge_code_unique` (`charge_code`),
  KEY `additional_charge_catalog_is_active_idx` (`is_active`),
  CONSTRAINT `additional_charge_catalog_created_by_user_id_foreign`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `additional_charge_catalog_updated_by_user_id_foreign`
    FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_additional_charge_catalog_price` CHECK (`unit_price` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## Orden recomendado de migraciones
1. `customers`
2. `room_types`
3. `rooms`
4. `room_images`
5. `seasons`
6. `room_prices`
7. `additional_charge_catalog`

## Notas tecnicas para implementacion (Adonis + MySQL)
- Mantener enums como `table.enum(...)` en migraciones para evitar desviaciones de estados.
- Preservar `CHECK` de capacidad, rangos de fecha y montos no negativos.
- Conservar las claves de auditoria operativa (`created_by_user_id`, `updated_by_user_id`) con `ON DELETE SET NULL`.
- Mantener `room_number` y codigos como identificadores funcionales unicos.

## Riesgos y validaciones a reforzar en capa aplicacion
- Evitar solapamiento de vigencias de `room_prices` para una misma combinacion efectiva.
- Validar coherencia `pricing_scope`:
  - `ROOM_TYPE` -> `room_id` debe ser `NULL`
  - `ROOM` -> `room_id` debe ser `NOT NULL`
- Validar formato funcional de `days_of_week_mask` como 7 caracteres binarios.
- Garantizar una sola imagen de portada por habitacion (`is_cover = 1`) mediante regla de aplicacion o indice funcional avanzado.

## Relacion con especificacion funcional
Este diseno responde a la fase inicial del documento base:
- [docs/requirements/hoteles-y-reservas.md](docs/requirements/hoteles-y-reservas.md)

Siguiente paso: generar migraciones de AdonisJS para este bloque, junto con modelos y validadores iniciales por entidad.

## Estado de implementacion en codigo

- Migracion creada: `database/migrations/1773000000000_create_hotels_phase1_tables.ts`
- Tipo de implementacion: SQL DDL directo via `this.schema.raw(...)` para respetar el diseno fisico aprobado.
- Modelos Lucid base creados para Fase 1.

### Modelos generados

- `app/models/customer.ts`
- `app/models/room_type.ts`
- `app/models/room.ts`
- `app/models/room_image.ts`
- `app/models/season.ts`
- `app/models/room_price.ts`
- `app/models/additional_charge_catalog.ts`

### Validadores base generados

- `app/validators/admin/hotels/create_customer_validator.ts`
- `app/validators/admin/hotels/create_room_type_validator.ts`
- `app/validators/admin/hotels/create_room_validator.ts`
- `app/validators/admin/hotels/create_room_image_validator.ts`
- `app/validators/admin/hotels/create_season_validator.ts`
- `app/validators/admin/hotels/create_room_price_validator.ts`
- `app/validators/admin/hotels/create_additional_charge_catalog_validator.ts`

### Controladores backend iniciales (catalogos)

- `app/controllers/admin/hotels/room_types_controller.ts`
- `app/controllers/admin/hotels/rooms_controller.ts`
- `app/controllers/admin/hotels/seasons_controller.ts`
- `app/controllers/admin/hotels/additional_charge_catalog_controller.ts`
- `app/controllers/admin/hotels/customers_controller.ts`
- `app/controllers/admin/hotels/room_images_controller.ts`
- `app/controllers/admin/hotels/room_prices_controller.ts`

### Rutas iniciales registradas

Se agregaron endpoints admin bajo `/admin/hotels/*` para:

- `room-types` (`index`, `store`, `update`)
- `rooms` (`index`, `store`, `update`)
- `seasons` (`index`, `store`, `update`)
- `additional-charges` (`index`, `store`, `update`)
- `customers` (`index`, `store`, `update`)
- `room-images` (`index`, `store`, `update`)
- `room-prices` (`index`, `store`, `update`)

### Reglas de negocio ya aplicadas en backend (fase inicial)

- `room_prices`: no permitir solapamiento de vigencias activas para la misma combinacion efectiva.
- `room_prices`: validar coherencia entre `pricingScope` y `roomId`.
- `room_prices`: validar `daysOfWeekMask` como 7 caracteres binarios.
- `room_images`: forzar una sola imagen portada por habitacion cuando `isCover=true`.

### Ejecucion

```bash
node ace migration:run
```

### Rollback de esta fase

```bash
node ace migration:rollback
```
