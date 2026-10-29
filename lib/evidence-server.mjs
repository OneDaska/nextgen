import {MAX_BYTES,validateEvidence} from './evidence-validation.mjs';
import {PROJECT,accessSession,sameOrigin,json,setSession} from './session-server.mjs';
export function stagingEvidenceConfig(){return PROJECT;}
export function createEvidenceHandlers(cfg=PROJECT,fetcher=fetch,sessionResolver=accessSession){
 return {async upload(req){
 if(!sameOrigin(req))return json({error:'Invalid request origin'},403);
 try{
  const session=await sessionResolver(req,fetcher);if(!session)return json({error:'Sign in required'},401);
  const id=req.headers.get('x-kpi-id'),month=req.headers.get('x-reporting-month'),name=decodeURIComponent(req.headers.get('x-file-name')||'');
  if(!/^[\w-]{1,100}$/.test(id||'')||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month||'')||!name||name.length>200||/[\r\n]/.test(name))return json({error:'Invalid file metadata'},400);
  const reader=req.body?.getReader();if(!reader)return json({error:'Missing file'},400);let size=0,chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();return json({error:'File exceeds 1 MB'},413);}chunks.push(value);}
  const bytes=Buffer.concat(chunks);let file;try{file=validateEvidence(bytes,name,req.headers.get('content-type'));}catch(e){return json({error:e.message},400);}
  const r=await fetcher(cfg.url+'/functions/v1/nextgen-evidence',{method:'POST',headers:{apikey:cfg.anon,Authorization:'Bearer '+session.access,'Content-Type':'application/json'},body:JSON.stringify({kpi_id:id,reporting_month:month,label:name,mime:file.mime,file_base64:bytes.toString('base64')}),cache:'no-store',redirect:'error'});return setSession(json(await r.json(),r.status),session.tokens||{});
 }catch{return json({error:'Evidence upload unavailable'},403);}},async download(req,id){try{if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Invalid evidence ID'},400);const session=await sessionResolver(req,fetcher);if(!session)return json({error:'Sign in required'},401);const r=await fetcher(cfg.url+'/functions/v1/nextgen-evidence/'+id,{headers:{apikey:cfg.anon,Authorization:'Bearer '+session.access},cache:'no-store',redirect:'error'});const h=new Headers(r.headers);h.set('Cache-Control','no-store');h.set('X-Content-Type-Options','nosniff');h.set('Content-Security-Policy',"sandbox; default-src 'none'");h.delete('set-cookie');return setSession(new Response(r.body,{status:r.status,headers:h}),session.tokens||{});}catch{return json({error:'Evidence download denied'},403);}}};
}
