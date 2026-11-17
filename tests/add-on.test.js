// Runs against Luna.MockEngine: no LUNA needed. `npm test`.
import { describe, expect, it } from 'vitest';
import { Luna } from '@uaudio/luna-builder-sdk';

globalThis.Luna = Luna;
await import('../logic.js');
const logic = globalThis.AddOnLogic;

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { name: 'Demo', tracks: ['Vocal', 'Bass', 'Drums'] });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await Promise.all(session.tracks.items.map((t) => t.loadStrip()));
  return { engine, luna, session };
}

const byName = (session, n) => session.visibleTracks.find((t) => t.name.value === n);

describe('Big Mute', () => {
  it('targets the first visible track when nothing is selected', async () => {
    const { session } = await connected();
    expect(logic.buttonState(session)).toMatchObject({ name: 'Vocal', muted: false, enabled: true });
  });

  it('follows the selected track', async () => {
    const { engine, session } = await connected();
    await session.context.lastSelectedTrack.set(byName(session, 'Bass').id);
    await engine.settled();
    expect(logic.buttonState(session).name).toBe('Bass');
  });

  it('mutes and unmutes only the selected track, touched once per click', async () => {
    const { engine, session } = await connected();
    const bass = byName(session, 'Bass');
    await session.context.lastSelectedTrack.set(bass.id);
    await engine.settled();
    engine.touches.length = 0;

    await logic.toggleSelectedMute(session);
    await engine.settled();
    expect(session.visibleTracks.map((t) => t.mute.on)).toEqual([false, true, false]);
    expect(logic.buttonState(session).muted).toBe(true);
    expect(engine.touches.map((t) => t.split(':').pop())).toEqual(['on', 'off']);

    await logic.toggleSelectedMute(session);
    await engine.settled();
    expect(session.visibleTracks.map((t) => t.mute.on)).toEqual([false, false, false]);
  });

  it('does nothing with no session', async () => {
    expect(await logic.toggleSelectedMute(undefined)).toBe(false);
    expect(logic.buttonState(undefined).enabled).toBe(false);
  });
});
