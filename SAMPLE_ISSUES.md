# Sample Issues for Unico Connect Issue Tracker

Each issue follows the fields from the "Create New Issue" form:
- Title
- Description
- Project
- Priority
- Status
- Assignee

---

## 1. Login fails with 500 error

- **Title**: Login fails with 500 error  
- **Description**: Users are intermittently seeing a 500 error after submitting the login form. The error appears more often during peak traffic (9–11 AM). Need logs checked and root cause identified.  
- **Project**: Project Alpha  
- **Priority**: HIGH  
- **Status**: OPEN  
- **Assignee**: Admin User  

---

## 2. Report export to CSV includes deleted records

- **Title**: Report export to CSV includes deleted records  
- **Description**: When exporting the “Monthly Performance” report to CSV, records that have been soft-deleted still appear in the file, even though they are hidden in the UI.  
- **Project**: Project Beta  
- **Priority**: MEDIUM  
- **Status**: IN_PROGRESS  
- **Assignee**: Alice Johnson  

---

## 3. Mobile menu overlaps content on iPhone

- **Title**: Mobile menu overlaps content on iPhone  
- **Description**: On iPhone 13 Safari, when the mobile menu is opened and closed, the header remains on top of the page content, blocking the first section.  
- **Project**: Project Gamma  
- **Priority**: HIGH  
- **Status**: OPEN  
- **Assignee**: Bob Smith  

---

## 4. Slow load time on dashboard for large accounts

- **Title**: Slow load time on dashboard for large accounts  
- **Description**: For customers with more than 1,000 issues, the main dashboard takes 10–15 seconds to load. We should profile the queries and add pagination or caching.  
- **Project**: Project Delta  
- **Priority**: HIGH  
- **Status**: IN_PROGRESS  
- **Assignee**: Charlie Lee  

---

## 5. Email notifications not sent for reopened issues

- **Title**: Email notifications not sent for reopened issues  
- **Description**: When an issue moves from RESOLVED back to OPEN, the assignee does not receive an email notification. This works correctly for new issues but not for reopened ones.  
- **Project**: Project Alpha  
- **Priority**: MEDIUM  
- **Status**: OPEN  
- **Assignee**: Admin User  

---

## 6. Unable to upload attachments over 5MB

- **Title**: Unable to upload attachments over 5MB  
- **Description**: File uploads larger than 5MB fail silently. The UI shows “Uploading…” but never completes. We should surface a clear error and consider increasing the limit.  
- **Project**: Project Beta  
- **Priority**: CRITICAL  
- **Status**: OPEN  
- **Assignee**: Alice Johnson  

---

## 7. Kanban board drag-and-drop not persisting status

- **Title**: Kanban board drag-and-drop not persisting status  
- **Description**: On the Kanban view, dragging a card from “In Progress” to “Resolved” visually updates the column, but after refresh the issue is still “IN_PROGRESS” in the backend.  
- **Project**: Project Gamma  
- **Priority**: HIGH  
- **Status**: OPEN  
- **Assignee**: Bob Smith  

---

## 8. Search by description misses partial matches

- **Title**: Search by description misses partial matches  
- **Description**: Searching for a keyword that appears in the middle of the description (e.g., “timeout”) returns no results unless the keyword is at the start. Likely using “starts with” instead of “contains”.  
- **Project**: Project Delta  
- **Priority**: MEDIUM  
- **Status**: OPEN  
- **Assignee**: Charlie Lee  

---

## 9. Dark mode text contrast too low on buttons

- **Title**: Dark mode text contrast too low on buttons  
- **Description**: In dark mode, primary buttons use a blue background with dark text, failing accessibility contrast guidelines. Need updated color tokens for WCAG AA.  
- **Project**: Project Alpha  
- **Priority**: LOW  
- **Status**: RESOLVED  
- **Assignee**: Admin User  

---

## 10. Incorrect totals in status summary cards

- **Title**: Incorrect totals in status summary cards  
- **Description**: The “Total Issues” and “In Progress” cards on the dashboard sometimes show different counts than the issues table after applying filters. Likely the summary ignores current filters.  
- **Project**: Project Beta  
- **Priority**: HIGH  
- **Status**: OPEN  
- **Assignee**: Alice Johnson  


Example 1 – Login bug
> When I try to log into the client portal as an external user, I get a 500 error after submitting the form. It only happens on Project Beta (the new portal), not on the legacy one. Steps I did: go to /login, enter a valid email/password, click Login, spinner shows for ~3 seconds, then “Something went wrong” appears. This is blocking UAT for the Beta launch.
Example 2 – Slow report / performance issue
> The “Monthly Revenue Summary” report in Project Gamma takes 45–60 seconds to load for Admin users. For regular employees it’s about 5 seconds. It started after we imported data for Q1 2026. This is making finance reviews very slow, especially on Mondays.
Example 3 – File upload issue (like your case)
> On Project Beta, file uploads larger than 5MB don’t complete. The UI stays stuck on “Uploading…” and never shows an error. Tried PNG and PDF files around 8–10MB. This is preventing the support team from attaching log files to tickets.
Example 4 – Feature request
> In Project Delta, users keep asking for a dark mode in the dashboard because they work late. Currently, the UI is very bright and causes eye strain. It would be great to have a toggle in the top-right that remembers the user’s preference.
Example 5 – Assignment / ownership hint
> This is related to the payments integration on Project Alpha (Stripe). Probably something the payments squad (Alice / Bob) should look at. We started seeing “card declined” more often after we changed the retry logic last sprint.
