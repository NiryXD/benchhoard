// ─── [Opus 4.8] Authored by Claude Opus 4.8 in this session (test layer) ─────
// Run: deno test supabase/functions/_shared/
import { assertEquals } from 'jsr:@std/assert@1';

import { osmTagsToBench, pointsFor } from './benches.ts';

Deno.test('osmTagsToBench: a bare bench maps to a true bench with no detail', () => {
  assertEquals(osmTagsToBench({ amenity: 'bench' }), {
    name: undefined,
    seatType: 'true_bench',
    material: undefined,
    amenities: [],
    capacity: undefined,
  });
});

Deno.test('osmTagsToBench: recovers material, amenities, capacity, and name', () => {
  const mapped = osmTagsToBench({
    amenity: 'bench',
    name: 'Riverside bench',
    material: 'Wooden',
    backrest: 'yes',
    covered: 'yes',
    lit: 'yes',
    wheelchair: 'yes',
    seats: '3',
  });
  assertEquals(mapped, {
    name: 'Riverside bench',
    seatType: 'true_bench',
    material: 'wood',
    amenities: ['backrest', 'covered', 'lit_at_night', 'wheelchair_accessible'],
    capacity: 3,
  });
});

Deno.test('osmTagsToBench: unknown material drops out, shelter counts as covered', () => {
  const mapped = osmTagsToBench({ amenity: 'bench', material: 'bamboo', shelter: 'yes' });
  assertEquals(mapped.material, undefined);
  assertEquals(mapped.amenities, ['covered']);
});

Deno.test('osmTagsToBench: nonsense seat counts are ignored, large counts clamp to 20', () => {
  assertEquals(osmTagsToBench({ amenity: 'bench', seats: 'lots' }).capacity, undefined);
  assertEquals(osmTagsToBench({ amenity: 'bench', seats: '0' }).capacity, undefined);
  assertEquals(osmTagsToBench({ amenity: 'bench', seats: '50' }).capacity, 20);
});

Deno.test('pointsFor: known actions award their value, unknown award nothing', () => {
  assertEquals(pointsFor('added'), 25);
  assertEquals(pointsFor('reviewed'), 10);
  assertEquals(pointsFor('first_visit'), 5);
  assertEquals(pointsFor('hoarded'), 2);
  assertEquals(pointsFor('teleported'), 0);
});
