function setupGhostApi({ apiUrl, apiKey }) {
  function contentEndpointFor({ resource, keys, params = '' }) {
    if (apiUrl && apiKey) {
      return `${apiUrl.replace(
        /\/$/,
        ''
      )}/${resource}/?key=${apiKey}&keys=${keys.join(',')}${params}`;
    }
    return '';
  }

  function makeRequest({
    url,
    method = 'GET',
    headers = {},
    credentials = undefined,
    body = undefined,
  }) {
    const options = {
      method,
      headers,
      credentials,
      body,
    };
    return fetch(url, options);
  }
  const api = {};

  api.site = {
    settings() {
      const url = contentEndpointFor({
        resource: 'settings',
        keys: ['announcement', 'announcement_background'],
      });
      return makeRequest({
        url,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(function (res) {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('Failed to fetch site data');
        }
      });
    },
  };

  api.init = async () => {
    let [settingsData] = await Promise.all([api.site.settings()]);

    return { settingsData };
  };

  return api;
}

export default setupGhostApi;
