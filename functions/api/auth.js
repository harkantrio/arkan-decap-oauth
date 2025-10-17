export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const state = crypto.randomUUID(); // could set a cookie if you want CSRF protection
  const redirect = new URL("https://github.com/login/oauth/authorize");
  redirect.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", env.OAUTH_REDIRECT_URI);
  redirect.searchParams.set("scope", "repo");
  redirect.searchParams.set("state", state);
  return Response.redirect(redirect.toString(), 302);
}
