import { unzipSync } from 'fflate';
import CFB from 'cfb';

export const MAX_BYTES = 1000000;
export const TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
export function validateEvidence(bytes, name, mime) {
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Files must be between 1 byte and 1 MB.');
  const ext = name.split('.').pop()?.toLowerCase();
  if (!Object.hasOwn(TYPES, ext) || (mime !== TYPES[ext] && mime !== 'application/octet-stream')) throw new Error('File extension and MIME must match PNG, PDF, DOC, DOCX or XLSX.');
  const buffer = Buffer.from(bytes);
  if (ext === 'pdf') {
    if (!buffer.subarray(0, 8).toString('ascii').match(/^%PDF-1\.[0-7]|^%PDF-2\.0/) || !buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) throw new Error('Invalid PDF structure.');
  } else if (ext === 'png') {
    if(!buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) || !buffer.subarray(-12,-8).equals(Buffer.from('00000000','hex')) || !buffer.subarray(-8,-4).equals(Buffer.from('IEND'))) throw new Error('Invalid PNG structure.');
  } else if (ext === 'doc') {
    if (!buffer.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))) throw new Error('Invalid DOC container.');
    const compound = CFB.read(buffer, { type: 'buffer' });
    if (!compound.FileIndex.some(e => /^WordDocument$/.test(e.name))) throw new Error('Word document stream missing.');
    if (compound.FullPaths.some(p => /VBA|Macros/i.test(p))) throw new Error('Macro-enabled documents are not accepted.');
  } else {
    let expanded = 0;
    const files = unzipSync(bytes, { filter(file) {
      expanded += file.originalSize;
      if (expanded > 40 * 1024 * 1024 || file.originalSize > 20 * 1024 * 1024 || /(^\/|\.\.|\\)/.test(file.name)) throw new Error('Unsafe XLSX archive.');
      return true;
    } });
    if (!files['[Content_Types].xml'] || !files[ext==='docx'?'word/document.xml':'xl/workbook.xml'] || !files['_rels/.rels']) throw new Error('XLSX workbook parts missing.');
    for (const [path, data] of Object.entries(files)) {
      if (/vbaProject|embeddings\//i.test(path)) throw new Error('Embedded programs are not accepted.');
      if (/\.(xml|rels)$/.test(path) && /<!DOCTYPE|<!ENTITY|TargetMode\s*=\s*["']External["']/i.test(new TextDecoder().decode(data))) throw new Error('External spreadsheet content is not accepted.');
    }
  }
  return { mime: TYPES[ext], size: bytes.length };
}
export function validateLink(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || value.length > 2048 || /[\u0000-\u0020]/.test(value)) throw new Error('Use a valid HTTP or HTTPS evidence link without credentials.');
  return url.href;
}
