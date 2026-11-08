export { default } from "next-auth/middleware";
// Every app page requires a session. API routes enforce auth themselves and return JSON 401s.
export const config = { matcher: ["/dashboard/:path*", "/plan/:path*", "/listening/:path*", "/reading/:path*", "/writing/:path*", "/speaking/:path*", "/mock/:path*", "/vocabulary/:path*", "/progress/:path*", "/achievements/:path*", "/profile/:path*", "/settings/:path*"] };
