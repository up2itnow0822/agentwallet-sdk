import { describe,it,expect,vi,beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
const mocks = vi.hoisted(() => ({lookup:vi.fn(),request:vi.fn()}));
vi.mock('node:dns/promises',() => ({lookup:mocks.lookup}));
vi.mock('node:https',() => ({request:mocks.request}));
import { fetchPublicHttpsJson,isPublicAddress } from '../identity/safe-fetch.js';
function respond(status: number, headers: Record<string,string> = {}, body = '{}') {
  mocks.request.mockImplementationOnce((_url,options,callback) => {
    const req = new EventEmitter() as EventEmitter & {end:()=>void;destroy:(e:Error)=>void};
    req.destroy = (error:Error) => {req.emit('error',error);};
    req.end = () => {
      options.lookup('metadata.example',{},(_error:unknown,address:string) => {expect(address).toBe('8.8.8.8');});
      const res = new EventEmitter() as EventEmitter & {statusCode:number;headers:Record<string,string>;destroy:()=>void};
      Object.assign(res,{statusCode:status,headers,destroy:()=>{}});
      callback(res); queueMicrotask(() => {res.emit('data',Buffer.from(body));res.emit('end');});
    };
    return req;
  });
}
beforeEach(() => {vi.clearAllMocks();mocks.lookup.mockResolvedValue([{address:'8.8.8.8',family:4}]);});
describe('pinned HTTPS transport', () => {
  it('passes DNS-validated address to socket lookup exactly once', async () => {
    respond(200,{},'{"ok":true}');
    expect(await fetchPublicHttpsJson('https://metadata.example/a')).toEqual({ok:true});
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
  });
  it('rejects redirect to metadata service before a second request', async () => {
    respond(302,{location:'https://169.254.169.254/latest'});
    await expect(fetchPublicHttpsJson('https://metadata.example/a')).rejects.toThrow(/public/);
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it('rejects a mixed public/private DNS answer', async () => {
    mocks.lookup.mockResolvedValue([{address:'8.8.8.8',family:4},{address:'10.0.0.1',family:4}]);
    await expect(fetchPublicHttpsJson('https://metadata.example/a')).rejects.toThrow(/public/);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('revalidates DNS on redirect and blocks rebinding', async () => {
    mocks.lookup.mockResolvedValueOnce([{address:'8.8.8.8',family:4}]).mockResolvedValueOnce([{address:'127.0.0.1',family:4}]);
    respond(302,{location:'/next'});
    await expect(fetchPublicHttpsJson('https://metadata.example/a')).rejects.toThrow(/public/);
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
  it('enforces streamed byte bound without Content-Length', async () => {
    respond(200,{},'x'.repeat(11));
    await expect(fetchPublicHttpsJson('https://metadata.example/a',{maxBytes:10})).rejects.toThrow(/byte/);
  });
  it('bounds DNS resolution with the total timeout', async () => {
    mocks.lookup.mockReturnValue(new Promise(()=>{}));
    await expect(fetchPublicHttpsJson('https://metadata.example/a',{timeoutMs:10})).rejects.toThrow(/deadline/);
  });
  it('rejects excessive redirect chains', async () => {
    respond(302,{location:'/next'});
    await expect(fetchPublicHttpsJson('https://metadata.example/a',{maxRedirects:0})).rejects.toThrow(/redirect/);
  });
  for (const address of ['0.0.0.0','127.0.0.1','192.168.1.1','100.64.0.1','198.18.0.1','192.0.2.1','198.51.100.1','203.0.113.1','224.0.0.1','240.0.0.1','::','::1','::ffff:127.0.0.1','fe80::1','fc00::1','ff02::1','2001:db8::1','2002:7f00:1::']) {
    it(`blocks reserved address ${address}`,()=>expect(isPublicAddress(address)).toBe(false));
  }
  it('accepts globally routable IPv6',()=>expect(isPublicAddress('2606:4700:4700::1111')).toBe(true));
});
