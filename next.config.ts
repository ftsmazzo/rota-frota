import type {NextConfig} from 'next';
const config:NextConfig={output:'standalone',poweredByHeader:false,serverExternalPackages:['pg'],experimental:{cpus:1},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(self), microphone=(self), geolocation=(self)'}]},{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache'}]}]}};
export default config;
