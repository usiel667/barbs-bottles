## ADDED Requirements

### Requirement: Expand control on the map
The inline map SHALL have an expand control that opens the map in a large overlay.

#### Scenario: Expand button present
- **WHEN** the inline map is shown
- **THEN** an expand button with an accessible label is visible on or beside the map

#### Scenario: Open the overlay
- **WHEN** the user activates the expand button
- **THEN** a modal overlay opens over the page showing the same address's map at a much larger size

#### Scenario: No expand control on the placeholder
- **WHEN** the "Map unavailable" placeholder is shown
- **THEN** there is no expand button

### Requirement: Closing the overlay
The overlay SHALL be closable by a close button, by the Escape key, and by clicking outside the map area.

#### Scenario: Close button
- **WHEN** the user activates the close button in the overlay
- **THEN** the overlay closes and the normal page layout is shown

#### Scenario: Escape key
- **WHEN** the overlay is open and the user presses Escape
- **THEN** the overlay closes

#### Scenario: Click outside
- **WHEN** the overlay is open and the user clicks the dimmed area outside the map
- **THEN** the overlay closes

#### Scenario: Click inside does not close
- **WHEN** the user clicks on the map or the overlay's content area
- **THEN** the overlay stays open

### Requirement: Overlay map loads only while open
The overlay's map iframe SHALL only be rendered while the overlay is open, so the page does not load two map iframes on first paint.

#### Scenario: Initial page load
- **WHEN** the customer detail page first renders with the overlay closed
- **THEN** only the inline map iframe is present in the page

#### Scenario: After closing
- **WHEN** the overlay is closed
- **THEN** the overlay's iframe is removed and the inline map is unchanged

### Requirement: Overlay accessibility
The overlay SHALL be a modal dialog that traps focus while open and returns focus to the expand button when closed.

#### Scenario: Focus handling
- **WHEN** the overlay opens and later closes
- **THEN** focus moves into the overlay while it is open and returns to the expand button after it closes
