// Netlify event function: runs automatically after every verified Netlify Forms
// submission. Upserts the registrant as a HubSpot contact (matched by email).
// Never throws and always returns 200, so HubSpot problems can't affect the form.

const FORM_NAME = 'vme-pilot-registration';
const UPSERT_URL = 'https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert';

const SEX = { 'גבר': 'man', 'אישה': 'woman' };

const clean = (v) => (v == null ? '' : String(v).trim());
const yesNo = (v) => (clean(v) && clean(v) !== 'false' && clean(v) !== 'off' ? 'yes' : 'no');

function buildProperties(data, createdAt) {
  const source = clean(data.source) || 'direct';

  const notes = [
    'VME landing registration',
    `Submitted: ${clean(createdAt)}`,
    `Looking for: ${clean(data.looking_for)}`,
    `Marital status: ${clean(data.marital_status)}`,
    `Has children: ${clean(data.has_children)}`,
    `Notes: ${clean(data.notes)}`,
    `Age confirmed: ${yesNo(data.age_confirmed)}`,
    `Terms accepted: ${yesNo(data.terms_accepted)}`,
    `Privacy accepted: ${yesNo(data.privacy_accepted)}`,
    `Marketing consent: ${yesNo(data.marketing_consent)}`,
    `Referrer: ${source}`,
  ].join('\n');

  const properties = {
    email: clean(data.email).toLowerCase(),
    firstname: clean(data.first_name),
    lastname: clean(data.last_name),
    phone: clean(data.phone),
    city: clean(data.city),
    date_of_birth: clean(data.birth_date),
    sex: SEX[clean(data.gender)] || '',
    referrer: source,
    first_source: source !== 'direct' ? 'Referral' : 'Organic',
    lifecyclestage: 'lead',
    internal_notes: notes,
  };

  for (const key of Object.keys(properties)) {
    if (!properties[key]) delete properties[key];
  }
  return properties;
}

async function upsert(token, email, properties) {
  const res = await fetch(UPSERT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: [{ idProperty: 'email', id: email, properties }] }),
  });
  const text = await res.text();
  // 207 = multi-status: the batch call succeeded but some inputs failed.
  const ok = res.ok && res.status !== 207;
  return { ok, status: res.status, text };
}

exports.handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body || '{}');
    if (!payload || payload.form_name !== FORM_NAME) {
      return { statusCode: 200 };
    }

    const data = payload.data || {};
    const email = clean(data.email || payload.email).toLowerCase();
    const token = process.env.HUBSPOT_TOKEN;

    if (!token) {
      console.warn('HubSpot: HUBSPOT_TOKEN is not set, skipping');
      return { statusCode: 200 };
    }
    if (!email) {
      console.warn('HubSpot: submission has no email, skipping');
      return { statusCode: 200 };
    }

    const properties = buildProperties({ ...data, email }, payload.created_at);
    let result = await upsert(token, email, properties);

    // An existing contact further down the funnel can't be moved back to "lead".
    if (!result.ok && /lifecyclestage/i.test(result.text)) {
      console.warn('HubSpot: lifecyclestage rejected, retrying without it');
      delete properties.lifecyclestage;
      result = await upsert(token, email, properties);
    }

    if (result.ok) {
      console.log(`HubSpot: contact upserted (${result.status}) referrer=${properties.referrer}`);
    } else {
      console.error(`HubSpot: upsert failed (${result.status}): ${result.text}`);
    }
  } catch (err) {
    console.error('HubSpot: unexpected error', err);
  }
  return { statusCode: 200 };
};

exports.buildProperties = buildProperties;
