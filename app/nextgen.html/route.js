import {dashboardHtml} from '@/lib/dashboard-document.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(){return new Response(dashboardHtml,{headers:{
 'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
 'Strict-Transport-Security':'max-age=31536000','Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'; upgrade-insecure-requests"
}});}
