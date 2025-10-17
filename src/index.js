export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── STEP 1: /api/auth ──────────────────────────────
    if (path === "/api/auth") {
      const authorize = new URL("https://github.com/login/oauth/authorize");
      authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorize.searchParams.set("redirect_uri", env.OAUTH_REDIRECT_URI);
      authorize.searchParams.set("scope", "repo");
      return Response.redirect(authorize.toString(), 302);
    }

    // ─── STEP 2: /api/callback ───────────────────────────
    if (path === "/api/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new URLSearchParams({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: env.OAUTH_REDIRECT_URI,
        }),
      });

      const data = await tokenResp.json();
      if (!data.access_token)
        return new Response("OAuth failed", { status: 401 });

      // Send token back to Decap CMS
      const html = `<!doctype html><html><body>
      <script>
        (function(){
          function send(){
            if(!window.opener)return;
            window.opener.postMessage(
              'authorization:github:success:' + ${JSON.stringify(data.access_token)},
              '*'
            );
            window.close();
          }
          send(); setTimeout(send,100);
        })();
      </script>
      </body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // ─── FALLBACK ────────────────────────────────────────
    return new Response("HARKAN Decap OAuth Worker", { status: 200 });
  },
};
