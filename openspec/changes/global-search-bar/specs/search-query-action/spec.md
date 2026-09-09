## ADDED Requirements

### Requirement: Cross-entity server-side search action
The system SHALL provide a server action that accepts a search query string and returns matching results grouped by Customers, Products, and Orders, querying the database rather than filtering client-side data.

#### Scenario: Query matches across entity types
- **WHEN** the search action is called with a query matching records in more than one table
- **THEN** it returns a grouped result object containing matches for each matching entity type

### Requirement: Customer field matching
The system SHALL match customers whose first name, last name, email, phone, address1, address2, city, or notes contains the query (case-insensitive).

#### Scenario: Match by partial email
- **WHEN** the query is a substring of a customer's email address
- **THEN** that customer appears in the Customers results

### Requirement: Product field matching
The system SHALL match product designs whose product name, design name, series name, size code, size description, or product description contains the query (case-insensitive), returning one result per matching design variant.

#### Scenario: Match by design name
- **WHEN** the query matches a design name (`product_designs.name`)
- **THEN** that design variant appears in the Products results, linked to its specific variant id

#### Scenario: Match by series name
- **WHEN** the query matches a product series name
- **THEN** every design variant under products in that series matching other criteria, or all designs of matching products in that series, appears in the Products results, subject to the per-group cap

### Requirement: Order field matching
The system SHALL match orders whose status, shipping address fields, design notes, or joined customer name contains the query (case-insensitive), and SHALL additionally match by exact order id when the trimmed query is a valid integer.

#### Scenario: Match by numeric order id
- **WHEN** the trimmed query is `"42"` and an order with id 42 exists
- **THEN** that order appears in the Orders results via an exact id match

#### Scenario: Match by customer name on an order
- **WHEN** the query matches the name of a customer who placed an order
- **THEN** that order appears in the Orders results

### Requirement: Per-entity result cap
The system SHALL independently cap each entity type's query to 5 returned results and indicate whether additional matches exist beyond the cap for that entity type.

#### Scenario: Query matches more than 5 customers
- **WHEN** a query matches 12 customers
- **THEN** the action returns 5 customer results and a flag indicating more customer matches exist

### Requirement: Minimum query length enforced server-side
The system SHALL reject or return an empty result set for queries shorter than 2 trimmed characters, independent of client-side enforcement.

#### Scenario: Short query sent directly to the action
- **WHEN** the search action is called with a 1-character (or empty/whitespace-only) query
- **THEN** it returns an empty grouped result set without querying the database
