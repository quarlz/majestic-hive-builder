/* One request per resource per page, shared by all wiki features. */
(() => {
  'use strict';
  const requests = new Map();
  function response(url) {
    const key = new URL(url, document.baseURI).href;
    if (!requests.has(key)) {
      requests.set(key, fetch(key).then(async result => {
        if (!result.ok) throw new Error(`Could not load ${url} (${result.status})`);
        return { body: await result.text(), status: result.status, headers: result.headers };
      }).catch(error => { requests.delete(key); throw error; }));
    }
    return requests.get(key).then(({body,status,headers}) => new Response(body, {status,headers}));
  }
  window.WikiData = Object.freeze({ response, json: url => response(url).then(r => r.json()) });
})();
