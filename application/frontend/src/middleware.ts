import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

export function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  const token = request.cookies.get("token")?.value;
  
  if (token && secret) {
    try {
      verify(token, secret);

      if (
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/register"
      ) {

        return NextResponse.redirect(new URL("/chat", request.url));
      }
    } catch (err) {
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register"],
};
