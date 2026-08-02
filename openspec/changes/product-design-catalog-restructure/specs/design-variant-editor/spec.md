## ADDED Requirements

### Requirement: Single-variant editor is scoped to exactly one product/design row
The system SHALL provide a page that edits exactly one `productDesigns` row (and its parent `products` row), reachable only from a variant's Edit action inside an expanded design row.

#### Scenario: Opening the editor for one variant
- **WHEN** a user clicks Edit on the "24oz / Tumbler v2" variant of design "Ocean Wave"
- **THEN** the single-variant editor loads with only that variant's and that product's data, not any other size/series of "Ocean Wave"

### Requirement: Single-variant editor fields
The system SHALL render, on the single-variant editor: Product Name (dropdown of existing names, with an "Add" action for a new name), Design Name (dropdown of existing design names), Cold Retention, Hot Retention, Warranty, Has Handle, Leak Proof, Price, MSRP, Quantity, and Active.

#### Scenario: All fields are present and editable
- **WHEN** a user opens the single-variant editor
- **THEN** every field listed above is present and its current value is editable

### Requirement: Series and Size render as read-only context, not editable fields
The system SHALL display the variant's Series and Size on the single-variant editor as read-only page context (e.g. in the page header) and SHALL NOT submit them as editable form fields.

#### Scenario: Series/Size are visible but not inputs
- **WHEN** a user views the single-variant editor for the "24oz / Tumbler v2" variant
- **THEN** "Tumbler v2" and "24oz" are visible on the page but there is no input control allowing the user to change either value from this page

### Requirement: Update and Cancel actions save or discard changes
The system SHALL provide an "Update Design" action that persists all editable field changes to the underlying `products` and `productDesigns` rows, and a "Cancel" action that discards changes and returns to the products page without saving.

#### Scenario: Saving changes
- **WHEN** a user changes the Price and Active fields and clicks "Update Design"
- **THEN** the corresponding `productDesigns` row is updated with the new values and the user is returned to the products page

#### Scenario: Cancelling discards edits
- **WHEN** a user changes a field value and then clicks "Cancel"
- **THEN** no changes are persisted and the user returns to the products page

### Requirement: Remove action deletes the variant
The system SHALL provide a right-aligned "Remove" action on the single-variant editor that deletes the underlying `productDesigns` row (and its parent `products` row if no other designs reference it) after confirmation.

#### Scenario: Removing a variant that is the only design on its product row
- **WHEN** a user clicks "Remove" on a variant whose parent `products` row has no other `productDesigns` entries, and confirms
- **THEN** both the `productDesigns` row and its parent `products` row are deleted

#### Scenario: Removing a variant that shares a product row with other designs
- **WHEN** a user clicks "Remove" on a variant whose parent `products` row still has other `productDesigns` entries after removal, and confirms
- **THEN** only that `productDesigns` row is deleted; the parent `products` row and its other designs remain
