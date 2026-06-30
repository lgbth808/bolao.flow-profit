export function GET(request: Request) {
  return Response.redirect(new URL("/brand/icones/favicon.png", request.url), 307);
}
