// A high-entropy, one-use setup invitation is the authentication credential.
// Only the approved pending Janet/Lawrencia accounts are eligible in the database.
const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function admin(path,body){const r=await fetch(url+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error'});if(!r.ok)throw Error('Setup unavailable');return r.json();}
Deno.serve(async request=>{
 if(request.method!=='POST')return response({error:'Method not allowed'},405);
 try{
  if(Number(request.headers.get('content-length'))>1024)return response({error:'Invalid request'},400);
  const reader=request.body?.getReader();if(!reader)return response({error:'Invalid request'},400);let size=0,chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return response({error:'Invalid request'},400);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const {token}=JSON.parse(new TextDecoder().decode(bytes));if(!/^[a-f0-9]{64}$/.test(token||''))return response({error:'Invalid setup invitation'},400);
  // Atomic expiry, one-use and pending-account checks happen before any Auth operation.
  const target=await admin('/rest/v1/rpc/nextgen_consume_setup_invitation',{p_token:token});
  const generated=await admin('/auth/v1/admin/generate_link',{type:'recovery',email:target.email,redirect_to:'https://nextgen.laineworkflow.online/nextgen.html'});
  const hash=generated.hashed_token||generated.properties?.hashed_token;if(!/^(?:[a-f0-9]{56}|[a-f0-9]{64})$/i.test(hash||''))throw Error('Setup unavailable');
  const verified=await fetch(url+'/auth/v1/verify',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({type:'recovery',token_hash:hash}),redirect:'error'});
  const session=await verified.json();if(!verified.ok||!session.access_token||!session.refresh_token||session.user?.id!==target.user_id)throw Error('Setup unavailable');
  // The app server turns these into HttpOnly cookies; it never returns tokens to page JS.
  return response({access_token:session.access_token,refresh_token:session.refresh_token,user:session.user});
 }catch{return response({error:'Setup invitation expired, already used or unavailable. Ask the administrator for a fresh link.'},403);}
});
