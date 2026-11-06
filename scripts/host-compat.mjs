// Some Windows sandbox sessions cannot resolve the OS account through libuv.
// Keep this fallback limited to authoring/build CLIs; it is not Worker code.
import os from 'node:os';
import {syncBuiltinESMExports} from 'node:module';
const original=os.userInfo;
os.userInfo=function(options){try{return original(options)}catch(error){if(!String(error.message).includes('uv_os_get_passwd'))throw error;return {username:process.env.USERNAME||'codex',homedir:os.homedir(),shell:null,uid:-1,gid:-1}}};
syncBuiltinESMExports();
