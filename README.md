# vme-landing

Static landing page for Vme, deployed on Netlify (`vme-landing`) and auto-published from `main`.

## HubSpot leads

Every submission of the `vme-pilot-registration` Netlify Form is also created/updated as a
HubSpot contact (matched by email) by the event function
[`netlify/functions/submission-created.js`](netlify/functions/submission-created.js).
Netlify Forms keeps working exactly as before; HubSpot errors are only logged and never
affect the submission.

**Env var:** `HUBSPOT_TOKEN` — access token of the HubSpot private app "Vme-Leads"
(scopes `crm.objects.contacts.read`, `crm.objects.contacts.write`). Set it in
Netlify → Site configuration → Environment variables. Never commit it.

| Form field | HubSpot property | Notes |
|---|---|---|
| `email` | `email` | trimmed + lowercased, used as the upsert key |
| `first_name` | `firstname` | |
| `last_name` | `lastname` | |
| `phone` | `phone` | |
| `city` | `city` | |
| `birth_date` | `date_of_birth` | `YYYY-MM-DD` |
| `gender` | `sex` | `גבר` → `man`, `אישה` → `woman` |
| `source` | `referrer` | defaults to `direct` |
| `source` | `first_source` | `Referral` if source ≠ `direct`, else `Organic` |
| — | `lifecyclestage` | `lead` (dropped on retry if HubSpot rejects it for an existing contact) |
| `looking_for`, `marital_status`, `has_children`, `notes`, consents, submit date | `internal_notes` | multi-line summary |

Empty values are not sent, so they never overwrite existing data in HubSpot.

**Per-person links:** give each person their own link with `?ref=<name>`, e.g.
`https://vme-landing.netlify.app/?ref=sheera`. The page copies `ref` into the hidden
`source` field, and it shows up in HubSpot as the contact's **Referrer** (`sheera`).
Visitors without `?ref=` get `direct`.

Logs: Netlify → Logs → Functions → `submission-created` (look for `contact upserted`).
