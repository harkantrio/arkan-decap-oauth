export async function onRequestGet({ env, request }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  // Exchange code for access token
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.OAUTH_REDIRECT_URI
    })
  });
  const data = await tokenResp.json();
  if (!data.access_token) {
    return new Response("OAuth failed", { status: 401 });
  }

  // Optional: restrict to your repo
  const allowed = (env.ALLOWED_REPOS || "").split(",").map(s => s.trim());
  // (Decap includes repo in requests; basic flow here just returns token)

  // Decap expects a page that posts the token to the CMS window
  const html = `
<!doctype html><html><body>
<script>
  (function() {
    function send() {
      if (!window.opener) return;
      window.opener.postMessage(
        'authorization:github:success:' + ${JSON.stringify(data.access_token)},
        '*'
      );
      window.close();
    }
    send();
    setTimeout(send, 100);
  })();
</script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" }});
}
