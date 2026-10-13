/** Node-only HTTPS metadata retrieval. DNS results are validated and pinned per hop. */
import { lookup } from 'node:dns/promises';
import { request, type RequestOptions } from 'node:https';
import { isIP } from 'node:net';

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6 || address.includes('%') || address.includes('.')) return false;
  const groups = address.toLowerCase().split(':');
  const first = parseInt(groups[0] || '0',16), second = parseInt(groups[1] || '0',16);
  // Only global unicast 2000::/3; excludes mapped, NAT64, loopback, ULA, multicast and link-local.
  return first >= 0x2000 && first <= 0x3fff && !(first === 0x2001 && (second < 0x200 || second === 0xdb8)) && first !== 0x2002 && !(first === 0x3fff && second < 0x1000);
}

export interface SafeFetchOptions { maxBytes?: number; timeoutMs?: number; maxRedirects?: number }
const MAX_BYTES = 1_048_576;
export async function fetchPublicHttpsJson(url: string, options: SafeFetchOptions = {}): Promise<unknown> {
  const maxBytes = options.maxBytes ?? MAX_BYTES, timeoutMs = options.timeoutMs ?? 5000, redirects = options.maxRedirects ?? 3;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000 || !Number.isSafeInteger(redirects) || redirects < 0 || redirects > 5) throw new Error('Invalid HTTPS fetch limits');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('HTTPS metadata deadline exceeded')),timeoutMs);
  try {
    let current = new URL(url);
    for (let hop = 0; hop <= redirects; hop++) {
      if (controller.signal.aborted) throw controller.signal.reason;
      if (current.protocol !== 'https:' || current.username || current.password || (current.port && current.port !== '443')) throw new Error('Metadata requires public HTTPS without credentials on port 443');
      const hostname = current.hostname.replace(/^\[|\]$/g,'');
      const records = isIP(hostname) ? [{address:hostname,family:isIP(hostname)}] : await Promise.race([
        lookup(hostname,{all:true,verbatim:true}),
        new Promise<never>((_,reject) => { controller.signal.addEventListener('abort',() => reject(controller.signal.reason),{once:true}); }),
      ]);
      if (controller.signal.aborted) throw controller.signal.reason;
      if (!records.length || records.some(record => !isPublicAddress(record.address))) throw new Error('Metadata address is not public');
      const pinned = records[0];
      const response = await new Promise<{status:number;location?:string;body:Buffer}>((resolve,reject) => {
        const requestOptions: RequestOptions & { autoSelectFamily: false } = {
          agent:false, family:pinned.family, autoSelectFamily:false, signal:controller.signal, method:'GET', headers:{accept:'application/json','accept-encoding':'identity'},
          lookup: (_host,_options,callback) => callback(null,pinned.address,pinned.family),
        };
        const req = request(current, requestOptions, res => {
          const status = res.statusCode ?? 0;
          if ([301,302,303,307,308].includes(status)) { res.destroy(); resolve({status,location:res.headers.location,body:Buffer.alloc(0)}); return; }
          if (status < 200 || status >= 300) { res.destroy(); reject(new Error(`Metadata HTTP ${status}`)); return; }
          if (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') { res.destroy(); reject(new Error('Compressed metadata is unsupported')); return; }
          const length = Number(res.headers['content-length'] ?? 0);
          if (length > maxBytes) { res.destroy(); reject(new Error('Metadata exceeds byte limit')); return; }
          const chunks: Buffer[] = []; let size = 0;
          res.on('data',(chunk:Buffer) => { size += chunk.length; if (size > maxBytes) { req.destroy(new Error('Metadata exceeds byte limit')); } else chunks.push(chunk); });
          res.on('error',reject); res.on('end',() => resolve({status,body:Buffer.concat(chunks)}));
        });
        req.on('error',reject); req.end();
      });
      if ([301,302,303,307,308].includes(response.status)) {
        if (!response.location || hop === redirects) throw new Error('Metadata redirect limit exceeded');
        current = new URL(response.location,current); continue;
      }
      return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(response.body)) as unknown;
    }
    throw new Error('Metadata redirect limit exceeded');
  } finally { clearTimeout(timer); }
}
