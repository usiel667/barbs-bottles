## ADDED Requirements

### Requirement: Map of the customer's address on the detail page
The customer detail page SHALL show a map of the customer's address in the Address section, beside the address fields.

#### Scenario: Map is shown
- **WHEN** an authenticated user views `/customers/{id}` for an existing customer and the map key is configured
- **THEN** the Address section contains a map of that customer's address, positioned to the right of the address fields on `md` and wider viewports

#### Scenario: Address used for the map
- **WHEN** the map is built for a customer
- **THEN** it is located using Address Line 1, City, State (2-letter code), and Zip Code, and does not include Address Line 2

#### Scenario: Read-only pages only
- **WHEN** the customer edit or create form is shown
- **THEN** no map is shown on it

### Requirement: Stacked address layout beside the map
The Address section SHALL present Address Line 1, Address Line 2 (when present), City, State, and Zip Code stacked in a single column, with the map in a second column on `md` and wider viewports.

#### Scenario: Desktop layout
- **WHEN** the viewport is `md` or wider
- **THEN** the address fields appear in one column from top to bottom in the order Address Line 1, Address Line 2, City, State, Zip Code, with the map to their right

#### Scenario: Address Line 2 hidden when empty
- **WHEN** the customer has no Address Line 2
- **THEN** that field is not shown and the remaining fields stay stacked in order

#### Scenario: Mobile layout
- **WHEN** the viewport is narrower than `md`
- **THEN** the map appears below the address fields at a fixed height without causing horizontal page scroll

### Requirement: Embed URL built on the server from an environment key
The system SHALL build the map's embed URL on the server from the address and the `GOOGLE_MAPS_EMBED_KEY` environment variable, and pass only the resulting URL to the client map component.

#### Scenario: Key configured
- **WHEN** `GOOGLE_MAPS_EMBED_KEY` is set
- **THEN** the map iframe loads a Google Maps Embed "place" URL whose query is the URL-encoded address

#### Scenario: Address text is encoded
- **WHEN** the address contains spaces, commas, or other special characters
- **THEN** they are URL-encoded so the query is passed to the map intact

### Requirement: Missing key fallback
When the map key is not configured, the system SHALL show a "Map unavailable" placeholder in the map's place instead of an iframe, and the rest of the page SHALL render normally.

#### Scenario: Key not set
- **WHEN** `GOOGLE_MAPS_EMBED_KEY` is not set
- **THEN** the map area shows "Map unavailable", no iframe is rendered, and the address fields and Orders card are unaffected

#### Scenario: Placeholder keeps the layout
- **WHEN** the placeholder is shown
- **THEN** it occupies the same map column so the two-column layout does not shift

### Requirement: Map accessibility
The map iframe SHALL have a descriptive title including the address, and be loaded lazily.

#### Scenario: Iframe attributes
- **WHEN** the map iframe is rendered
- **THEN** it has a `title` of "Map of {address}" and lazy loading enabled
