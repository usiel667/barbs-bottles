## ADDED Requirements

### Requirement: Customer detail route
The system SHALL provide a read-only customer detail page at `/customers/{id}` within the authenticated dashboard, where `{id}` is the customer's numeric id.

#### Scenario: Existing customer
- **WHEN** an authenticated user visits `/customers/{id}` for a customer that exists
- **THEN** the page renders that customer's details

#### Scenario: Unknown customer
- **WHEN** a user visits `/customers/{id}` and no customer has that id
- **THEN** the system responds with the not-found page

#### Scenario: Non-numeric id
- **WHEN** a user visits `/customers/abc`
- **THEN** the system responds with the not-found page

#### Scenario: Form route unaffected
- **WHEN** a user visits `/customers/form` or `/customers/form?id={id}`
- **THEN** the existing create/edit form is shown, not the detail page

### Requirement: Entry point from Customers list
The system SHALL make each customer's name on the Customers list a link to that customer's detail page, on both the desktop table and the mobile card list.

#### Scenario: Click name on desktop
- **WHEN** a user clicks a customer's name in the desktop table
- **THEN** the browser navigates to `/customers/{id}` for that customer

#### Scenario: Tap name on mobile
- **WHEN** a user taps a customer's name in the mobile card list
- **THEN** the browser navigates to `/customers/{id}` for that customer

#### Scenario: Row Edit button unchanged
- **WHEN** a user clicks the Edit button on a list row
- **THEN** the browser navigates directly to `/customers/form?id={id}`

### Requirement: Read-only field display mirroring the edit form
The detail page SHALL present the customer's data in the same sections and grid layout as the edit form — Personal Information, Address, and Additional Information — rendered as text rather than editable inputs.

#### Scenario: Personal information
- **WHEN** the page renders
- **THEN** it shows first name, last name, email, and phone, with email as a `mailto:` link and phone as a `tel:` link

#### Scenario: Missing email or phone
- **WHEN** the customer has no email or no phone
- **THEN** the page shows a muted "No email" / "No phone" placeholder in place of the value

#### Scenario: Address
- **WHEN** the page renders
- **THEN** it shows address line 1, city, the full state name, and zip code, and shows address line 2 only when it has a value

#### Scenario: Additional information
- **WHEN** the page renders
- **THEN** it shows the customer's notes (or nothing when empty) and an Active or Inactive status badge in place of the form's checkbox

#### Scenario: Sections visually separated
- **WHEN** the page renders
- **THEN** a horizontal divider with extra spacing separates Personal Information, Address, Additional Information, and the Edit button area from one another

#### Scenario: No editable controls
- **WHEN** the page renders
- **THEN** it contains no form inputs, selects, textareas, or submit buttons

### Requirement: Edit button and navigation
The detail page SHALL show an Edit button, in the position of the edit form's "Save Changes" button, that navigates to the customer's edit form, and a "Back to Customers" button in the page header.

#### Scenario: Edit
- **WHEN** a user clicks Edit
- **THEN** the browser navigates to `/customers/form?id={id}` for that customer

#### Scenario: Back
- **WHEN** a user clicks "Back to Customers"
- **THEN** the browser navigates to `/customers`
