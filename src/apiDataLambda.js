import axios from 'axios';

export async function handler(event) {

  const URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

  const params = Object.assign(event.queryStringParameters, {
    api_key: 'TOzd6H2m6vIGdpERhHv7Zbnd6FIQ6f6Cohy2bT5V',
  });

  const response = await axios.get(URL, {
    params,
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response.data),
  };
}
