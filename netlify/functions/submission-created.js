// Netlify event function: runs automatically after every verified Netlify Forms
// submission and forwards it to the HubSpot form "Vme Landing - Pilot Registration".
// Never throws and always returns 200, so HubSpot problems can't affect the form.

const FORM_NAME = 'vme-pilot-registration';
const PORTAL_ID = '146832758';
const FORM_GUID = '88768169-3ffc-4840-bbd4-9590f4378bc0';
const SUBMIT_PATH = `/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_GUID}`;
const HOSTS = ['https://api.hsforms.com', 'https://api-eu1.hsforms.com'];
const SITE_URL = 'https://vme-landing.netlify.app/';

const SEX = { 'גבר': 'man', 'אישה': 'woman' };

const clean = (v) => (v == null ? '' : String(v).trim());
const yesNo = (v) => (clean(v) && clean(v) !== 'false' && clean(v) !== 'off' ? 'yes' : 'no');

function buildBody(data, createdAt) {
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

  const values = {
    email: clean(data.email).toLowerCase(),
    firstname: clean(data.first_name),
    lastname: clean(data.last_name),
    phone: clean(data.phone),
    city: clean(data.city),
    date_of_birth: clean(data.birth_date),
    sex: SEX[clean(data.gender)] || '',
    referrer: source,
    internal_notes: notes,
  };

  const fields = Object.entries(values)
    .filter(([, value]) => value)
    .map(([name, value]) => ({ objectTypeId: '0-1', name, value }));

  return {
    submittedAt: Date.now(),
    fields,
    context: {
      pageUri: `${SITE_URL}?ref=${encodeURIComponent(source)}`,
      pageName: `Vme Landing - ${source}`,
    },
  };
}

async function submit(body) {
  let result;
  for (const host of HOSTS) {
    const res = await fetch(host + SUBMIT_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    result = { ok: res.ok, status: res.status, text: await res.text(), host };
    // Only a 404 (portal/form not found on this region) is worth retrying elsewhere.
    if (res.status !== 404) break;
  }
  return result;
}

exports.handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body || '{}');
    if (!payload || payload.form_name !== FORM_NAME) {
      return { statusCode: 200 };
    }

    const data = payload.data || {};
    const email = clean(data.email || payload.email).toLowerCase();
    if (!email) {
      console.warn('HubSpot: submission has no email, skipping');
      return { statusCode: 200 };
    }

    const body = buildBody({ ...data, email }, payload.created_at);
    const result = await submit(body);

    if (result.ok) {
      console.log(`HubSpot: form submitted (${result.status}) via ${result.host} referrer=${clean(data.source) || 'direct'}`);
    } else {
      console.error(`HubSpot: submit failed (${result.status}) via ${result.host}: ${result.text}`);
    }
  } catch (err) {
    console.error('HubSpot: unexpected error', err);
  }
  return { statusCode: 200 };
};

exports.buildBody = buildBody;
