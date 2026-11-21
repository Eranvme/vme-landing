# vme-landing

Static landing page for Vme, deployed on Netlify (`vme-landing`) and auto-published from `main`.

## Registrations (Vme admin)

### How it works

The registration form posts straight to Vme admin: `POST https://profile.vme-value.com/api/meetings/register`
(`http://localhost:3001` when the page runs on localhost). Admin saves one row per email in
**Registrations**: sending the form again updates the details and adds the submission, with its
`?ref=` source, to the history. The reply carries the registration id, which the meeting step
sends along with the booking (`POST /api/meetings/book`).

HubSpot and Netlify Forms are no longer used (the `submission-created` function was removed).
Older submissions stay in the Netlify Forms dashboard and in HubSpot.

| Form field | Sent as |
|---|---|
| `first_name`, `last_name` | `firstName`, `lastName` |
| `email` | `email` (admin lowercases it) |
| `phone` | `phone` |
| `birth_date` | `birthDate` (`YYYY-MM-DD`) |
| `age_confirmed`, `marketing_consent` | `ageConfirmed`, `marketingConsent` (booleans) |
| `source` | `source` (from `?ref=`, defaults to `direct`) |
| `bot-field` | `botField` (honeypot; admin ignores anything that fills it) |

After a booking, Vme admin sends the confirmation, a Google Calendar invite (when Google
Workspace is connected), reminders before the start, and a "meeting started" email to anyone
not in the call yet.

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

### After the form: the mentor's page

When `?ref=` is set (and isn't `direct`), a successful submission sends the visitor to
`https://profile.vme-value.com/r/<ref>`. vme-admin looks up the mentor whose **Registration link
name (ref)** is `<ref>` (Mentors → mentor → Invite Landing Page) and redirects to their page
`/m/<token>?registered=1`: photo, name, title, short description, iOS/Android buttons credited to
the mentor, QR code and the mentor's personal WhatsApp button.

A `ref` with no mentor behind it (e.g. `eran`, or a mentor whose link name isn't set yet) comes
back here as `/?ref=<ref>#registered`, which shows the regular thank-you box. So to turn a
person's link on, set their link name in admin; nothing here changes.

The form is a single page (name, date of birth, phone, email, consent); `city` and `gender` are
no longer collected. Consent comes after the personal details: two required checkboxes, both
unticked by default — `age_confirmed` (18+) and `marketing_consent` (updates, event invitations
and offers by WhatsApp, SMS and email; can be withdrawn at any time) — followed by the short
privacy notice and the Terms of Use / Privacy Policy links. Both are saved on the registration.

### Seeing registrations per person

In Vme admin, **Registrations**: filter by source (`shira`, `lina`, …), search, or export CSV.

### Logs

Registration and booking errors are logged by Vme admin (Railway service logs), not Netlify.
