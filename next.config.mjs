const nextConfig={
 poweredByHeader:false,
 async redirects(){return[{source:'/',destination:'/nextgen.html',permanent:false}];},
 async headers(){return[{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'no-referrer'},{key:'Strict-Transport-Security',value:'max-age=31536000'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]},{source:'/nextgen.html',headers:[{key:'Cache-Control',value:'no-store'},{key:'Content-Security-Policy',value:"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'; upgrade-insecure-requests"}]}];},
 images:{unoptimized:true}
};export default nextConfig;
