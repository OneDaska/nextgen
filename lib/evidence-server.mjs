import { MAX_BYTES, validateEvidence } from './evidence-validation.mjs';
const config={url:'https://fxzdrbxadlmguyekmseb.supabase.co',anon:'sb_publishable_MovqlibZOeHjt4hQ8ThwPg_VevgMKvI'};
export function stagingEvidenceConfig(){return config;}
export function createEvidenceHandlers(cfg=config,fetcher=fetch){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const fail=(error,status)=>Response.json({error},{status,headers});
 async function call(request,path,method='GET',body){
  const token=request.headers.get('authorization');if(!/^Bearer [^\s]+$/.test(token||''))throw Error('Sign in required');
  const response=await fetcher(cfg.url+path,{method,headers:{apikey:cfg.anon,Authorization:token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',redirect:'error'});
  if(!response.ok)throw Error('Evidence access denied or unavailable');return response.json();
 }
 return {async upload(request){try{
  const id=request.headers.get('x-kpi-id'),month=request.headers.get('x-reporting-month'),name=decodeURIComponent(request.headers.get('x-file-name')||'');
  if(!/^[\w-]{1,100}$/.test(id||'')||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month||'')||!name||name.length>200||/[\r\n]/.test(name))return fail('Invalid file metadata',400);
  const reader=request.body?.getReader();if(!reader)return fail('Missing file',400);let size=0,chunks=[];
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();return fail('File exceeds 1 MB',413);}chunks.push(Buffer.from(value));}
  const bytes=Buffer.concat(chunks);let file;try{file=validateEvidence(bytes,name,request.headers.get('content-type'));}catch(e){return fail(e.message,400);}
  const rows=await call(request,'/rest/v1/nextgen_kpi_evidence','POST',{kpi_id:id,reporting_month:month,kind:'file',label:name,mime:file.mime,size_bytes:size,file_base64:bytes.toString('base64')});return Response.json({id:rows[0].id,status:'unverified'},{status:201,headers});
 }catch{return fail('Evidence upload denied or unavailable',403);}},async download(request,id){try{
  if(!/^[0-9a-f-]{36}$/i.test(id))return fail('Invalid evidence ID',400);
  const rows=await call(request,'/rest/v1/nextgen_kpi_evidence?id=eq.'+id+'&kind=eq.file&select=label,mime,file_base64');if(!rows.length)return fail('Evidence unavailable',404);const e=rows[0];
  return new Response(Buffer.from(e.file_base64,'base64'),{headers:{...headers,'Content-Type':e.mime,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(e.label),'X-File-Name':encodeURIComponent(e.label),'Content-Security-Policy':"sandbox; default-src 'none'"}});
 }catch{return fail('Evidence download denied',403);}}};
}
