# UI Issues & Design

A running log of visual issues spotted in the app and design changes to make or remove.

---

## Open Issues

<!-- Add UI bugs and visual problems here -->
<!-- Example:
### [Page] — Short description
**Location:** `app/(dashboard)/...`
**Problem:** What looks wrong or broken.
**Fix:** What needs to change.
-->
### [Products Page] — Edit buttons are black
**Location:** `app/(dashboard)/products/page.tsx` — lines 95 and 120
**Problem:** Edit buttons use `variant="outline"` which renders black text in light mode.
**Fix:** Replace both instances with the same blue style used on the customers page.

```tsx
// Current (lines 95 and 120) — BROKEN
<Button asChild variant="outline" size="sm" className="dark:text-white">

// Fix
<Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
```

---

### [Products Page] — Add Product button text is black
**Location:** `app/(dashboard)/products/page.tsx` — lines 25 and 36
**Problem:** Button has `bg-blue-600` but is missing `text-white`, so the text inherits and shows black.
**Fix:** Add `text-white` to the className.

```tsx
// Current (lines 25 and 36) — BROKEN
<Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">

// Fix
<Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
```






## Design Changes

<!-- Add things to add, remove, or redesign here -->

---

## Resolved

<!-- Move items here once fixed, with the date -->

---

## Design Constants

Rules that every page must follow for visual consistency. When building or reviewing a page, check against this list.

---

### Buttons

| Type | Classes | Usage |
|------|---------|-------|
| Primary action (Add, Save, Submit) | `bg-blue-600 hover:bg-blue-700 text-white` | Top of page CTA, empty-state CTA |
| Edit | `bg-blue-600 hover:bg-blue-700 text-white` + `size="sm"` | Table rows and mobile cards |
| Destructive (Delete) | `bg-red-600 hover:bg-red-700 text-white` + `size="sm"` | Table rows and mobile cards |
| Ghost / secondary | `variant="ghost"` | Low-priority inline actions |

**Rules:**
- All Edit buttons must be blue (`bg-blue-600`) with white text (`text-white`) — never outline or default variant alone
- Never rely on `variant="default"` for color — always set `bg-` and `text-` explicitly to avoid theme bleed
- Always pair `bg-blue-600` with `hover:bg-blue-700` and `text-white`

---

### Text & Headings

| Element | Classes |
|---------|---------|
| Page title (`h1`) | `text-3xl font-bold text-gray-900 dark:text-white` |
| Section subtitle | `text-gray-600 dark:text-gray-300` |
| Table cell text | `text-sm text-gray-700 dark:text-gray-300` |
| Table header | `text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider` |

---

### Status Badges

| State | Classes |
|-------|---------|
| Active / success | `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300` |
| Inactive / neutral | `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300` |

Wrap with: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

---

### Cards & Containers

| Element | Classes |
|---------|---------|
| Page card / table wrapper | `bg-white dark:bg-gray-800 rounded-lg shadow-sm border` |
| Empty state container | `text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border` |
| Avatar circle | `rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold` |
