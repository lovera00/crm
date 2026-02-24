import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/health',
  '/api/auth/.*',
  '/auth/login',
];

// Define role-based route access
const roleBasedRoutes: Record<string, string[]> = {
  '/api/personas': ['gestor', 'supervisor', 'administrador'],
  '/api/seguimientos': ['gestor', 'supervisor', 'administrador'],
  '/api/autorizaciones': ['supervisor', 'administrador'],
  '/api/actualizaciones-diarias': ['administrador'],
  '/api/dashboard': ['gestor', 'supervisor', 'administrador'],
  '/api/config': ['gestor', 'supervisor', 'administrador'],
  '/api/telefonos': ['gestor', 'supervisor', 'administrador'],
  '/api/emails': ['gestor', 'supervisor', 'administrador'],
  '/api/referencias-personales': ['gestor', 'supervisor', 'administrador'],
  '/api/referencias-laborales': ['gestor', 'supervisor', 'administrador'],
  '/api/deudas': ['gestor', 'supervisor', 'administrador'],
  '/api/estados-deuda': ['gestor', 'supervisor', 'administrador'],
  '/api/usuarios': ['administrador'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes('.*')) {
      const regex = new RegExp(`^${route.replace('.*', '.*')}$`);
      return regex.test(pathname);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get token from session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }

  // Check if user is active (token should contain this info)
  // Note: We rely on NextAuth to validate the token
  
  // Check role-based access
  const userRole = token.role as string;
  const userId = token.id as string;

  // Find matching route for role check
  let hasAccess = false;
  for (const [routePattern, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(routePattern)) {
      if (allowedRoles.includes(userRole)) {
        hasAccess = true;
        break;
      }
    }
  }

  // If no specific role rule matches, allow access (fallback)
  // This is for routes not defined in roleBasedRoutes
  if (!hasAccess) {
    // Check if route is an API route
    if (pathname.startsWith('/api/') && !Object.keys(roleBasedRoutes).some(route => pathname.startsWith(route))) {
      // For undefined API routes, deny access
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have permission to access this resource' },
        { status: 403 }
      );
    }
    // For non-API routes, allow access if authenticated
    hasAccess = true;
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied', message: 'You do not have permission to access this resource' },
      { status: 403 }
    );
  }

  // Add user info to request headers for API routes to use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-user-role', userRole);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

// Configure matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};