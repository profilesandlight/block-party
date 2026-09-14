const { connectLambda, getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  // Lambda compatibility mode requires connectLambda to inject
  // the Netlify Blobs environment credentials from the event.
  connectLambda(event);

  const store = getStore("block-party");

  try {
    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};

      if (params.list !== undefined) {
        const prefix = params.list || "";
        const { blobs } = await store.list({ prefix });
        const keys = blobs.map((b) => b.key);
        return { statusCode: 200, body: JSON.stringify({ keys, prefix }) };
      }

      const key = params.key;
      if (!key) {
        return { statusCode: 400, body: JSON.stringify({ error: "key or list required" }) };
      }
      const value = await store.get(key);
      if (value === null || value === undefined) {
        return { statusCode: 200, body: JSON.stringify(null) };
      }
      return { statusCode: 200, body: JSON.stringify({ key, value }) };
    }

    if (event.httpMethod === "POST") {
      const { key, value } = JSON.parse(event.body || "{}");
      if (!key) {
        return { statusCode: 400, body: JSON.stringify({ error: "key required" }) };
      }
      await store.set(key, value);
      return { statusCode: 200, body: JSON.stringify({ key, value }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
