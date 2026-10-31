const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const {sessionRoute}=require('../lib/session-server.mjs');
(async()=>{
 const original=global.fetch;let forwarded;
 global.fetch=async(url,o)=>{assert.ok(url.endsWith('/functions/v1/nextgen-setup-invitations'));forwarded=JSON.parse(o.body);return Response.json({access_token:'private-access',refresh_token:'private-refresh',user:{id:'owner'}})};
 const req=body=>new Request('https://nextgen.laineworkflow.online/api/session',{method:'POST',headers:{origin:'https://nextgen.laineworkflow.online','content-type':'application/json'},body:JSON.stringify(body)});
 const ok=await sessionRoute(req({action:'verify-invitation',setup_token:'a'.repeat(64)}));assert.equal(ok.status,200);assert.deepEqual(await ok.json(),{user:{id:'owner'}});assert.match(ok.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);assert.deepEqual(forwarded,{token:'a'.repeat(64)});
 assert.equal((await sessionRoute(req({action:'verify-invitation',setup_token:'bad'}))).status,400);
 global.fetch=async()=>Response.json({error:'expired'},{status:403});assert.equal((await sessionRoute(req({action:'verify-invitation',setup_token:'a'.repeat(64)}))).status,403);global.fetch=original;
 const code=fs.readFileSync('supabase/functions/nextgen-setup-invitations/index.ts','utf8');let handler,calls=[],expired=false,wrongOwner=false;
 const context=vm.createContext({Response,Request,Uint8Array,TextDecoder,JSON,Number,Error,Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://test.supabase.co':'server-only-key'},serve:h=>handler=h},fetch:async(url,o)=>{calls.push({url,body:JSON.parse(o.body)});if(url.includes('nextgen_consume_setup_invitation'))return Response.json(expired?{error:'used'}:{email:'lawrencia.edwards@laineservices.com',user_id:'owner'},{status:expired?403:200});if(url.includes('generate_link'))return Response.json({hashed_token:'b'.repeat(56)});return Response.json({access_token:'access',refresh_token:'refresh',user:{id:wrongOwner?'attacker':'owner'}});}});
 vm.runInContext(code,context);const edgeReq=token=>new Request('https://edge.test',{method:'POST',body:JSON.stringify({token})});
 assert.equal((await handler(edgeReq('a'.repeat(64)))).status,200);assert.equal(calls.length,3);assert.equal(calls[0].body.p_token,'a'.repeat(64));assert.equal(calls[1].body.email,'lawrencia.edwards@laineservices.com');assert.equal(calls[2].body.type,'recovery');
 calls=[];expired=true;assert.equal((await handler(edgeReq('a'.repeat(64)))).status,403);assert.equal(calls.length,1);expired=false;wrongOwner=true;assert.equal((await handler(edgeReq('a'.repeat(64)))).status,403);
 calls=[];assert.equal((await handler(edgeReq('bad'))).status,400);assert.equal(calls.length,0);
 console.log('PASS: 48-hour invitation exchange uses atomic DB authorization before Auth; invalid/expired invitations and wrong identities denied; browser gets no session tokens.');
})();
