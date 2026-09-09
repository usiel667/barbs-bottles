## ADDED Requirements

### Requirement: Header search input
The system SHALL render an always-visible text search input in `components/Header.tsx`, positioned in the header's right-hand group to the left of the day/night `ModeToggle` and to the right of the nav links.

#### Scenario: Search input visible on every dashboard page
- **WHEN** an authenticated user views any page under the dashboard layout
- **THEN** the header displays the search input in a fixed position left of the mode toggle

### Requirement: Minimum query length before searching
The system SHALL NOT trigger a search request while the trimmed query is fewer than 2 characters.

#### Scenario: Single character entered
- **WHEN** the user types a single character into the search input
- **THEN** no search request is sent and the results dropdown remains closed

#### Scenario: Two characters entered
- **WHEN** the user types a second character, bringing the trimmed query to 2 characters
- **THEN** a debounced search request is scheduled

### Requirement: Debounced search requests
The system SHALL wait approximately 300ms after the user stops typing before firing a search request, canceling any pending request superseded by newer input.

#### Scenario: Rapid typing
- **WHEN** the user types multiple characters within 300ms of each other
- **THEN** only one search request fires, using the final query value, after typing pauses

### Requirement: Grouped, live results dropdown
The system SHALL display search results in a dropdown below the search input, grouped by entity type (Customers, Products, Orders), showing only groups that have at least one match.

#### Scenario: Results span multiple entity types
- **WHEN** a search for "smith" matches both a customer and an order
- **THEN** the dropdown shows a Customers group and an Orders group, omitting an empty Products group

#### Scenario: No matches found
- **WHEN** a search query of 2+ characters returns zero results across all three entity types
- **THEN** the dropdown shows a single "no results" message instead of empty group headers

#### Scenario: Search request in flight
- **WHEN** a debounced search request has been sent but has not yet resolved
- **THEN** the dropdown shows a loading state rather than a stale or empty result list

### Requirement: Capped results per group with overflow indicator
The system SHALL cap each entity group to 5 displayed results and indicate when more matches exist beyond the cap.

#### Scenario: More than 5 matches for one entity type
- **WHEN** a search matches 8 products
- **THEN** the Products group shows 5 results and an indicator that more results exist

### Requirement: Result navigation
The system SHALL link each result to that record's existing edit page: customers to `/customers/form?id={id}`, product designs to `/products/design-variant/{id}`, and orders to `/orders/form?id={id}`.

#### Scenario: Selecting a customer result
- **WHEN** the user clicks or presses Enter on a highlighted customer result
- **THEN** the browser navigates to that customer's edit page

### Requirement: Keyboard navigation and dismissal
The system SHALL support Arrow Up/Down to move a highlighted selection across the flattened result list, Enter to navigate to the highlighted result, Escape to close the dropdown, and click-outside to close the dropdown.

#### Scenario: Arrow key navigation
- **WHEN** the results dropdown is open and the user presses Arrow Down
- **THEN** the next result in the flattened list (Customers, then Products, then Orders) becomes highlighted

#### Scenario: Escape closes dropdown
- **WHEN** the results dropdown is open and the user presses Escape
- **THEN** the dropdown closes and the search input loses focus

#### Scenario: Click outside closes dropdown
- **WHEN** the results dropdown is open and the user clicks anywhere outside the search input and dropdown
- **THEN** the dropdown closes
