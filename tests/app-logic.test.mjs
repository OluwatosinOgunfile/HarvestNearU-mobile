import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

async function moduleSource(path){return readFile(new URL(path,import.meta.url),'utf8')}

test('order status groups closed and active orders consistently',async()=>{
  const source=await moduleSource('../lib/order-status.ts');
  const closed=[...source.match(/new Set\(\[(.*?)\]\)/s)[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual(closed,['delivered','collected','cancelled','refunded']);
  assert.equal(closed.includes('preparing'),false);
});

test('notification routes cover actionable destinations',async()=>{
  const source=await moduleSource('../lib/notification-route.ts');
  assert.match(source,/startsWith\('\/orders'\).*return '\/orders'/s);
  assert.match(source,/startsWith\('\/admin'\).*return '\/workspace'/s);
  assert.match(source,/startsWith\('\/support'\).*return '\/support'/s);
  assert.match(source,/return '\/notifications'/);
});
