## ADDED Requirements

### Requirement: Bulk design editor shows every variant of one design in an editable table
The system SHALL provide a page that, given a design name, lists every `productDesigns` row with that name (joined to its product's series and size) as an editable table row with Price, MSRP, Quantity, and Active fields.

#### Scenario: Loading the bulk editor for a design
- **WHEN** a user opens the bulk design editor for design "Ocean Wave" which has variants in 3 series
- **THEN** the page shows one row per series/size variant of "Ocean Wave", each showing that variant's Series, Size, Price, MSRP, Quantity, and Active state as editable fields

### Requirement: Bulk edits save all variants together in one submission
The system SHALL persist edits to any number of variant rows via a single submit action that updates all changed rows in one transaction.

#### Scenario: Editing multiple variants and saving once
- **WHEN** a user changes the Price on 2 variant rows and the Quantity on a 3rd, then clicks a single save action
- **THEN** all 3 changes are persisted together, and if any single row fails validation, none of the changes are committed

#### Scenario: Quantity changes keep inStock consistent
- **WHEN** a user sets a variant's Quantity to 0 in the bulk editor and saves
- **THEN** that variant's `inStock` is set to `false`; conversely setting Quantity above 0 sets `inStock` to `true`

### Requirement: Bulk editor does not add or remove variants
The system SHALL restrict the bulk design editor to editing existing variants' Price/MSRP/Quantity/Active fields; adding a brand-new series/size variant or removing a variant SHALL NOT be available from this page.

#### Scenario: No add/remove controls present
- **WHEN** a user views the bulk design editor for any design
- **THEN** there is no control to add a new variant row or delete an existing variant row from this page
