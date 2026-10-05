// Seeds an isolated YallaPMS copy (API :3091, DB /tmp/yp-demo/db) with invented demo data only.
const B = 'http://127.0.0.1:3091/api'; let token;
async function api(route, method = 'GET', body, ok = [200, 201]) {
  const r = await fetch(B + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!ok.includes(r.status)) { console.error('FAIL', method, route, r.status, t.slice(0, 300)); }
  return j;
}
const reg = await api('/auth/register', 'POST', { name: 'Demo Admin', email: 'demo@example.invalid', password: 'Demo-only-7731!' });
token = reg.token || (await api('/auth/login', 'POST', { email: 'demo@example.invalid', password: 'Demo-only-7731!' })).token;
const o1 = await api('/owners', 'POST', { name: 'Demo Owner A', email: 'owner.a@example.invalid', phone: '+971500000000' });
const o2 = await api('/owners', 'POST', { name: 'Demo Owner B', email: 'owner.b@example.invalid', phone: '+971500000000' });
const o3 = await api('/owners', 'POST', { name: 'Demo Owner C', email: 'owner.c@example.invalid', phone: '+27000000000' });
const P = {};
const mk = async (key, p, s) => { P[key] = await api('/properties', 'POST', p); await api(`/accounting/settings/${P[key].id}`, 'PUT', s); };
const dxb = { tourismEnabled: true, vatEnabled: true, vatPercent: 5, platformFeeAirbnb: 15.5, platformFeeBookingCom: 15, platformFeeVrbo: 8, cleaningRateCard: true };
await mk('marina', { name: 'Marina Tower 2BR (demo)', unitNumber: 'DM-2', city: 'Dubai', country: 'UAE', currency: 'AED', bedrooms: 2, bedroomType: '2 Bedroom', area: 'Dubai Marina', ownerId: o1.id }, { ...dxb, managementFeePercent: 20, tourismRate: 10, cleaningFee: 250 });
await mk('downtown', { name: 'Downtown Studio (demo)', unitNumber: 'DS-1', city: 'Dubai', country: 'UAE', currency: 'AED', bedrooms: 0, bedroomType: 'Studio', area: 'Downtown Dubai', ownerId: o1.id }, { ...dxb, managementFeePercent: 20, tourismRate: 10, cleaningFee: 150 });
await mk('jvc', { name: 'JVC Garden 1BR (demo)', unitNumber: 'JV-1', city: 'Dubai', country: 'UAE', currency: 'AED', bedrooms: 1, bedroomType: '1 Bedroom', area: 'Jumeirah Village Circle', ownerId: o2.id }, { ...dxb, managementFeePercent: 18, tourismRate: 10, cleaningFee: 180 });
await mk('creek', { name: 'Creek View 3BR (demo)', unitNumber: 'CV-3', city: 'Dubai', country: 'UAE', currency: 'AED', bedrooms: 3, bedroomType: '3 Bedroom', area: 'Dubai Creek Harbour', ownerId: o2.id }, { ...dxb, managementFeePercent: 20, tourismRate: 15, cleaningFee: 300 });
const za = { tourismEnabled: false, vatEnabled: false, platformFeeAirbnb: 15.5, platformFeeBookingCom: 15, cleaningRateCard: false, cleaningCostOverride: 0, currency: 'ZAR' };
await mk('beach', { name: 'Seaside House 3BR (demo)', unitNumber: 'GQ-3', city: 'Gqeberha', country: 'South Africa', currency: 'ZAR', bedrooms: 3, bedroomType: '3 Bedroom', area: 'Summerstrand', ownerId: o3.id }, { ...za, managementFeePercent: 20, cleaningFee: 450 });
await mk('garden', { name: 'Garden Cottage 2BR (demo)', unitNumber: 'GQ-2', city: 'Gqeberha', country: 'South Africa', currency: 'ZAR', bedrooms: 2, bedroomType: '2 Bedroom', area: 'Walmer', ownerId: o3.id }, { ...za, managementFeePercent: 20, cleaningFee: 350 });
const names = ['Alex Demo', 'Priya Demo', 'Thabo Demo', 'Lena Demo', 'Omar Demo', 'Sam Demo', 'Mia Demo', 'Yusuf Demo', 'Nina Demo', 'Leo Demo', 'Zara Demo', 'Ben Demo', 'Aisha Demo', 'Tom Demo', 'Rosa Demo', 'Kai Demo'];
let n = 0; const R = [];
const book = async (k, ci, co, platform, gross, extra = {}) => {
  const p = P[k]; const isDxb = p.currency === 'AED';
  const body = { propertyId: p.id, guestName: names[n++ % names.length], guestEmail: `guest${n}@example.invalid`, platform, checkIn: ci, checkOut: co, status: 'confirmed', confirmationCode: `DEMO${1000 + n}`, ...(gross ? { financeMode: 'inclusive-v1', grossAmount: gross, dubaiCharges: isDxb } : {}), ...extra };
  const r = await api('/reservations', 'POST', body); R.push({ k, ...r }); return r;
};
// September (checked out, verified)
await book('marina', '2026-09-02', '2026-09-06', 'airbnb', 4200);
await book('marina', '2026-09-08', '2026-09-12', 'booking_com', 3900);
await book('marina', '2026-09-15', '2026-09-20', 'vrbo', 5100);
await book('marina', '2026-09-23', '2026-09-27', 'direct', 3600);
await book('downtown', '2026-09-01', '2026-09-04', 'airbnb', 1650);
await book('downtown', '2026-09-05', '2026-09-09', 'booking_com', 2100);
await book('downtown', '2026-09-12', '2026-09-16', 'airbnb', 2050);
await book('downtown', '2026-09-20', '2026-09-24', 'airbnb');
await book('jvc', '2026-09-03', '2026-09-07', 'airbnb', 2600);
await book('jvc', '2026-09-10', '2026-09-15', 'booking_com', 3100);
await book('jvc', '2026-09-18', '2026-09-22', 'airbnb');
await book('creek', '2026-09-04', '2026-09-09', 'booking_com', 7400);
await book('creek', '2026-09-14', '2026-09-19', 'airbnb', 7900);
await book('beach', '2026-09-05', '2026-09-09', 'airbnb', 9800);
await book('beach', '2026-09-19', '2026-09-23', 'booking_com', 10400);
await book('garden', '2026-09-11', '2026-09-14', 'airbnb', 5200);
await book('garden', '2026-09-24', '2026-09-28', 'airbnb');
// October
await book('marina', '2026-09-30', '2026-10-04', 'airbnb', 4300);
await book('marina', '2026-10-04', '2026-10-08', 'booking_com', 4100);
await book('downtown', '2026-10-02', '2026-10-06', 'airbnb', 2150);
await book('downtown', '2026-10-09', '2026-10-13', 'vrbo');
await book('jvc', '2026-10-04', '2026-10-09', 'airbnb');
await book('jvc', '2026-10-14', '2026-10-18', 'direct', 2900);
await book('creek', '2026-10-01', '2026-10-05', 'booking_com', 6800);
await book('creek', '2026-10-10', '2026-10-15', 'airbnb');
await book('beach', '2026-10-03', '2026-10-07', 'airbnb');
await book('beach', '2026-10-16', '2026-10-20', 'booking_com');
await book('garden', '2026-10-06', '2026-10-10', 'airbnb');
await book('garden', '2026-10-22', '2026-10-26', 'airbnb');
// blocks
await api('/blocked-dates', 'POST', { propertyId: P.creek.id, startDate: '2026-10-20', endDate: '2026-10-24', reason: 'Owner stay', ownerStay: true }, [200, 201, 404]);
// statuses for past stays
for (const r of R) if (r.id && r.checkOut <= '2026-10-04') await api(`/reservations/${r.id}`, 'PATCH', { status: r.checkOut < '2026-10-04' ? 'checked_out' : 'checked_in' });
// cleaner staff + cleaning
await api('/users', 'POST', { name: 'Demo Cleaner', email: 'cleaner@example.invalid', password: 'Clean-only-7731!', role: 'cleaner' });
const staff = await api('/staff', 'POST', { name: 'Demo Cleaner', email: 'cleaner@example.invalid', role: 'cleaner', active: true });
const tasks = await api('/cleaning');
for (const t of tasks) {
  if (t.scheduledDate < '2026-10-04') { await api(`/cleaning/${t.id}`, 'PATCH', { assignedToId: staff.id, status: 'scheduled' }); await api(`/cleaning/${t.id}`, 'PATCH', { status: 'completed' }); await api(`/cleaning/${t.id}`, 'PATCH', { status: 'approved' }); }
  else if (t.scheduledDate <= '2026-10-08') await api(`/cleaning/${t.id}`, 'PATCH', { assignedToId: staff.id, status: 'scheduled' });
}
// expenses
await api('/accounting/transactions', 'POST', { type: 'expense', amount: '85.00', date: '2026-09-18', category: 'Supplies', description: 'Bathroom amenities restock', propertyId: P.marina.id, allocation: 'owner' });
await api('/accounting/transactions', 'POST', { type: 'expense', amount: '320.00', date: '2026-09-21', category: 'Maintenance', description: 'AC filter service', propertyId: P.creek.id, allocation: 'owner' });
await api('/accounting/transactions', 'POST', { type: 'expense', amount: '650.00', date: '2026-09-12', category: 'Garden', description: 'Garden service', propertyId: P.beach.id, allocation: 'owner', currency: 'ZAR' });
// statements for September
const gen = await api('/accounting/statements/generate', 'POST', { month: '2026-09' });
console.log('generated', gen.statements?.length, 'skipped', JSON.stringify(gen.skipped?.map(s => s.reason)).slice(0, 400));
const sts = await api('/accounting/statements?month=2026-09');
const arr = Array.isArray(sts) ? sts : sts.data || sts.items || [];
for (const s of arr) { if ([P.marina.id, P.creek.id].includes(s.propertyId)) await api(`/accounting/statements/${s.id}`, 'PATCH', { status: 'sent' }); }
const mp = arr.find(s => s.propertyId === P.marina.id); if (mp) await api(`/accounting/statements/${mp.id}`, 'PATCH', { status: 'paid' });
console.log('properties', Object.keys(P).length, 'reservations', R.filter(r => r.id).length);
