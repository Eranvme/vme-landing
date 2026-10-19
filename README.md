# vme-landing

Static landing page for Vme, deployed on Netlify (`vme-landing`) and auto-published from `main`.

## HubSpot leads

### How it works

The registration form is a Netlify Form named `vme-pilot-registration` and keeps working
exactly as before. After Netlify verifies each submission it automatically runs the event
function [`netlify/functions/submission-created.js`](netlify/functions/submission-created.js),
which also submits the registration to the HubSpot form **"Vme Landing - Pilot Registration"**
(portal `146832758`, EU, form GUID `88768169-3ffc-4840-bbd4-9590f4378bc0`) via the public
Forms API v3. HubSpot then creates/updates the contact by email.

- Submissions from any other form, or without an email, are ignored.
- It posts to `api.hsforms.com` and falls back to `api-eu1.hsforms.com` if that returns 404.
- HubSpot errors are only logged; the function always returns 200, so they never affect the
  Netlify submission.
- No API token is needed for this endpoint (`HUBSPOT_TOKEN` is not used).

### Field mapping

| Form field | HubSpot field | Notes |
|---|---|---|
| `email` | `email` | trimmed + lowercased |
| `first_name` | `firstname` | |
| `last_name` | `lastname` | |
| `phone` | `phone` | |
| `city` | `city` | |
| `birth_date` | `date_of_birth` | `YYYY-MM-DD` |
| `gender` | `sex` | `גבר` → `man`, `אישה` → `woman`, anything else omitted |
| `source` | `referrer` | from `?ref=`, defaults to `direct` |
| `looking_for`, `marital_status`, `has_children`, `notes`, `age_confirmed`, `terms_accepted`, `privacy_accepted`, `marketing_consent`, submit date, referrer | `internal_notes` | multi-line summary, consents as yes/no |

Empty values are not sent. The submission's page is recorded as
`https://vme-landing.netlify.app/?ref=<source>` with page name `Vme Landing - <source>`.

### Per-person links

The page copies the `?ref=` URL parameter into the hidden `source` field (`direct` when absent).

| Person | Link |
|---|---|
| Lina | https://vme-landing.netlify.app/?ref=lina |
| Shira (שירה) | https://vme-landing.netlify.app/?ref=shira |
| Shahar (שחר) | https://vme-landing.netlify.app/?ref=shahar |
| Bini (ביני) | https://vme-landing.netlify.app/?ref=bini |
| Shipi (שיפי) | https://vme-landing.netlify.app/?ref=shipi |
| Liat (ליאת) | https://vme-landing.netlify.app/?ref=liat |
| Adi (עדי) | https://vme-landing.netlify.app/?ref=adi |
| Eran (ערן) | https://vme-landing.netlify.app/?ref=eran |

### Seeing leads per person in HubSpot

- **Marketing → Forms → "Vme Landing - Pilot Registration" → Submissions**: every submission,
  with the Referrer column and page URL (`?ref=<name>`).
- **CRM → Contacts**: add a filter **Referrer** is `<name>` (e.g. `shira`) and save it as a view
  per person if useful.

### Logs

Netlify → Logs → Functions → `submission-created`. Success lines start with
`HubSpot: form submitted`; failures with `HubSpot: submit failed (<status>)` plus HubSpot's
error body.
