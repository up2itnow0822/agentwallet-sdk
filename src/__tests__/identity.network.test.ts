import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveAgentURI } from '../identity/erc8004.js';
afterEach(() => vi.unstubAllGlobals());
describe('registration URI boundaries', () => {
  for (const url of ['http://example.com/agent.json','https://127.0.0.1/a','https://169.254.169.254/a','https://[::1]/a','https://user:pass@example.com/a']) {
    it(`blocks ${url}`, async () => {
      vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({name:'attacker'})}));
      await expect(resolveAgentURI(url)).rejects.toThrow();
    });
  }
  it('rejects oversized data URI before parsing', async () => {
    const body = Buffer.from(JSON.stringify({name:'x'.repeat(1_100_000)})).toString('base64');
    await expect(resolveAgentURI('data:application/json;base64,'+body)).rejects.toThrow();
  });
});
