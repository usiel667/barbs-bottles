## ADDED Requirements

### Requirement: Bottle sizes are a persisted lookup, not a fixed enum
The system SHALL store bottle sizes in a `bottle_sizes` table (`id`, `code` unique, `description`) rather than a Postgres enum, and `products.size` SHALL reference `bottle_sizes.id`.

#### Scenario: Existing sizes are preserved through migration
- **WHEN** the migration backfilling `products.size_id` runs against existing data
- **THEN** every product row ends up pointing at a `bottle_sizes` row whose `code` matches its previous enum value, with no data loss

#### Scenario: Adding a new size from the UI
- **WHEN** a user clicks "Add" next to the Size field on the Add Product page and submits a new size code/description
- **THEN** a new row is inserted into `bottle_sizes` and immediately appears as a selectable option in the Size dropdown, without requiring a schema migration or app redeploy

### Requirement: Product series are a persisted lookup, not free text
The system SHALL store series in a `product_series` table (`id`, `name` unique), and `products.series` SHALL reference `product_series.id`.

#### Scenario: Existing series are preserved through migration
- **WHEN** the migration backfilling `products.series_id` runs against existing data
- **THEN** every distinct series string previously in `products.series` (including the hardcoded `ProductConstants.ProductSeries` values) exists as exactly one row in `product_series`, and every product points at the matching row

#### Scenario: Adding a new series from the UI
- **WHEN** a user clicks "Add" next to the Series field on the Add Product page and submits a new series name
- **THEN** a new row is inserted into `product_series` and immediately appears as a selectable option in the Series dropdown

#### Scenario: Duplicate series name is rejected
- **WHEN** a user tries to add a series name that already exists in `product_series` (case-insensitive match)
- **THEN** the system rejects the add with a validation error instead of creating a duplicate row

### Requirement: Product name suggestions come from existing data, not a separate table
The system SHALL populate the Product Name dropdown on the Add Product page from `SELECT DISTINCT name FROM products`, without introducing a dedicated lookup table for names.

#### Scenario: Selecting an existing product name
- **WHEN** a user opens the Product Name dropdown on the Add Product page
- **THEN** every distinct name currently present in `products.name` is listed as an option

#### Scenario: Adding a brand-new product name
- **WHEN** a user clicks "Add Product Name," types a new name, and completes the Add Product form submission
- **THEN** the new product is created with that name, and the name subsequently appears in the dropdown's distinct-name list for future product creation
