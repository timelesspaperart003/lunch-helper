// ============================================
// 午餐叫飯小幫手（獨立版）- Cloudflare Worker
// ============================================

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") return corsResponse();

    if (path === "/api/parse" && method === "POST") return handleParse(request, env);

    return env.ASSETS.fetch(request);
  }
};

async function handleParse(request, env) {
  let body;
  try { body = await request.json(); }
  catch (e) { return jsonResp({ ok: false, error: "INVALID_BODY" }, 400); }

  if (!body.images || !body.images.length) {
    return jsonResp({ ok: false, error: "NO_IMAGES" }, 400);
  }

  const gasResult = await postToGASReal(env.GAS_URL, {
    action: "parseUberOrder",
    images: body.images
  });
  return jsonResp(gasResult, gasResult.ok === false ? 502 : 200);
}

// 真正的 POST（圖片資料量大，不能塞進網址 GET）→ 打 GAS doPost
async function postToGASReal(url, body) {
  if (!url) return { ok: false, error: "GAS_URL_NOT_SET" };
  let resp;
  try {
    resp = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (e) {
    return { ok: false, error: "GAS_FETCH_FAILED", detail: String(e) };
  }
  const respText = await resp.text();
  if (respText.trimStart().startsWith('<!DOCTYPE') || respText.trimStart().startsWith('<html')) {
    return { ok: false, error: "GAS_TIMEOUT_OR_ERROR", status: resp.status };
  }
  try { return JSON.parse(respText); }
  catch (e) { return { ok: false, error: "GAS_INVALID_JSON", detail: respText.slice(0, 200) }; }
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}
