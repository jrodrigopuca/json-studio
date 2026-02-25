# Chrome Web Store - Permission Justifications

## Required Permissions

### `activeTab`

**Justification:** Access the current tab to extract JSON content when the user clicks the extension icon.

**Short version:** Extract JSON from the active tab when user clicks icon.

---

### `clipboardWrite`

**Justification:** Allow users to copy JSON data and formatted output to their clipboard.

**Short version:** Copy JSON data to clipboard on user request.

---

### `contextMenus`

**Justification:** Add a right-click menu option to format selected JSON text on any webpage.

**Short version:** Add right-click menu to format selected JSON.

---

### `storage`

**Justification:** Temporarily store extracted JSON data to pass between the extension's service worker and viewer.

**Short version:** Temporarily store JSON data for viewer display.

---

### `scripting`

**Justification:** Execute scripts on the active tab to extract JSON content from web pages.

**Short version:** Extract JSON content from web pages.

---

## Host Permissions

### `<all_urls>` (Content Scripts) - **CORE FUNCTIONALITY**

**Primary Use Case:** JSON files can be served from any domain. Users frequently access JSON from APIs, config files, and data endpoints across countless different domains that cannot be predicted.

**What it does:**

- Detects when a webpage contains only raw JSON (e.g., `https://api.github.com/users/github`)
- Replaces the plain text view with a beautiful, interactive JSON viewer
- **Does NOT execute on regular web pages** - only activates when the entire page is a JSON response

**Why `<all_urls>` is essential:**

- JSON sources are unpredictable: any domain can serve JSON (GitHub API, company APIs, localhost, development servers, etc.)
- Specifying individual domains is impossible - would break core functionality
- Without this, users would need to manually copy-paste JSON from every API they visit

**Privacy & Security:**

- Content script is minimal (~50 lines)
- Only reads page content to detect JSON format
- No data is transmitted externally
- No modification of regular web pages
- Code is open source and auditable

**Short version:** Auto-detect and format JSON responses from any API or web server. Essential for core functionality as JSON can come from any domain.

---

### `<all_urls>` (Web Accessible Resources)

**Justification:** Load viewer interface resources when formatting JSON detected from any origin.

**Short version:** Load viewer resources to display formatted JSON from detected pages.

---

## Privacy Statement

**Data Handling:**

- All JSON processing happens locally in the user's browser
- No data is sent to external servers
- No analytics or tracking
- Storage is temporary and session-only

**User Control:**

- Extension only activates when user clicks the icon or right-clicks
- No automatic data collection
- Users can inspect all processing in browser DevTools

---

## Recommended Responses for Chrome Web Store

Copy these concise justifications directly into the Chrome Web Store submission form:

| Permission                | Justification                                                                                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **activeTab**             | Extract JSON from current tab when user clicks extension icon                                                                                                                                                                                                        |
| **clipboardWrite**        | Copy formatted JSON to clipboard on user request                                                                                                                                                                                                                     |
| **contextMenus**          | Add right-click option to format selected JSON text                                                                                                                                                                                                                  |
| **storage**               | Temporarily store JSON for display in viewer interface                                                                                                                                                                                                               |
| **scripting**             | Extract JSON content from web pages via user action                                                                                                                                                                                                                  |
| **Host &lt;all_urls&gt;** | Auto-detect and format JSON responses from ANY API or server. JSON sources are unpredictable (GitHub API, company APIs, localhost, etc.). Specifying domains would break core functionality. Content script only activates on pure JSON pages, not regular websites. |

---

## Response to Google's Broad Host Permission Warning

**If Google asks: "Why not use activeTab instead?"**

We DO use activeTab for user-initiated actions (icon clicks, right-click menu). However, the core value proposition of JSON Spark is automatic detection and formatting of JSON responses.

**Example use case:**

1. User visits `https://api.github.com/users/github`
2. Browser shows ugly raw JSON text
3. JSON Spark automatically detects this is pure JSON
4. Replaces it with beautiful, searchable, collapsible tree view

**Why we can't specify domains:**

- Users access JSON from unlimited sources: company APIs, public APIs, localhost during development, testing servers, data exports, configuration files
- Impossible to predict which domains will serve JSON
- Specifying domains would require users to manually add each API they use - defeating the purpose

**Security measures:**

- Content script only activates when page contains ONLY JSON (not regular websites)
- Lightweight script (~50 lines), open source
- No data collection, no external network calls
- All processing happens locally in browser

**Alternative considered:** Optional host permission would require users to grant permission for every API domain they use - poor UX and breaks the "just works" experience.

---

## Additional Notes

- **No Remote Code:** All code is bundled with the extension
- **No External Calls:** Extension works completely offline
- **Privacy First:** Zero data collection, zero tracking
- **Open Source:** Code is publicly available for audit
