## ADDED Requirements

### Requirement: Products page groups rows by design name
The system SHALL group the products list by `productDesigns.name` alone (not by series+design), so every series/size that carries a given design contributes to a single row.

#### Scenario: Same design across multiple series
- **WHEN** a design named "Ocean Wave" exists under both the "Tumbler v2" and "Mini" series
- **THEN** the products page shows exactly one "Ocean Wave" row, not one row per series

### Requirement: Products list columns are Design, Series Avail, In Stock, Action
The system SHALL render the desktop products table with columns, in order: expand control, `Design`, `Series Avail`, `In Stock`, `Action`. The `Status` column SHALL be removed from the top-level row.

#### Scenario: Series Avail reflects distinct series count
- **WHEN** a design has variants in 3 distinct series (regardless of how many sizes within each)
- **THEN** the `Series Avail` cell for that design's row shows `3`

#### Scenario: In Stock reflects variant-level stock across all series/sizes
- **WHEN** a design has 5 total series/size variants and 2 of them have `inStock = true`
- **THEN** the `In Stock` cell shows "2 of 5"

### Requirement: Expanding a design row lists every series/size variant
The system SHALL show, when a design row is expanded, one sub-row per series/size combination that carries that design, including that variant's Series, Size, Price, MSRP, In Stock/Quantity, Active status, and an Edit action.

#### Scenario: Expanding shows series and size together
- **WHEN** a user clicks a design row to expand it
- **THEN** each sub-row displays both the Series and the Size for that variant (not size alone, since variants can now span multiple series)

### Requirement: Design row has a top-level Edit action for bulk editing
The system SHALL provide an Edit action on each top-level design row that navigates to the bulk design editor for every variant of that design.

#### Scenario: Clicking the design-level Edit action
- **WHEN** a user clicks the Edit action in the top-level `Action` column for a design row
- **THEN** the user is taken to the bulk design editor pre-loaded with every series/size variant of that design

### Requirement: Each expanded variant row has its own Edit action for single-variant editing
The system SHALL provide an Edit action on each variant sub-row (inside the expanded dropdown) that navigates to the single-variant design editor for that specific product/design row.

#### Scenario: Clicking a variant's Edit action
- **WHEN** a user clicks Edit on one series/size variant row inside an expanded design
- **THEN** the user is taken to the single-variant design editor scoped to that exact product/design pair, not to the bulk editor
