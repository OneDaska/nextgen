const assert=require('node:assert/strict');
const {validateEvidence,MAX_BYTES}=require('../lib/evidence-validation.mjs');
const pdf=Buffer.from('%PDF-1.7\n1 0 obj\n%%EOF');
assert.equal(validateEvidence(pdf,'report.pdf','application/pdf').mime,'application/pdf');
assert.throws(()=>validateEvidence(Buffer.alloc(MAX_BYTES+1),'large.pdf','application/pdf'),/1 MB/);
assert.throws(()=>validateEvidence(Buffer.from('not a pdf'),'report.pdf','application/pdf'),/PDF structure/);
assert.throws(()=>validateEvidence(Buffer.from('x'),'report.exe','application/octet-stream'),/extension and MIME/);
assert.throws(()=>validateEvidence(Buffer.from('x'),'report.pdf','text/plain'),/extension and MIME/);
console.log('PASS: evidence size, extension, MIME and signature validation.');
