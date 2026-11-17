// Big Mute: DOM wiring. Connects to LUNA, follows the focused session and its selected track,
// and paints one big button. Every onChange release is kept and called when things change.

const $ = (id) => document.getElementById(id);
let luna;
let session;
let sessionReleases = [];
let trackReleases = [];
const releaseAll = (list) => { for (const u of list.splice(0)) u(); };

function paint() {
  const s = AddOnLogic.buttonState(session);
  const btn = $('mute');
  btn.disabled = !s.enabled;
  btn.classList.toggle('on', s.muted);
  btn.querySelector('.label').textContent = s.muted ? 'MUTED' : 'MUTE';
  $('track').textContent = s.name;
}

async function bindTrack() {
  releaseAll(trackReleases);
  const track = session?.focusedTrack.value;
  if (track) {
    await track.loadStrip();
    trackReleases.push(track.mute.real.onChange(paint));
    trackReleases.push(track.name.onChange(paint));
  }
  paint();
}

async function bindSession() {
  releaseAll(sessionReleases);
  releaseAll(trackReleases);
  session = luna.sessions.current();
  if (!session) {
    $('status').textContent = 'no session open';
    paint();
    return;
  }
  await session.ready();
  $('status').textContent = session.name.value ?? session.uid;
  sessionReleases.push(session.focusedTrack.onChange(bindTrack));
  await bindTrack();
}

async function connect() {
  for (;;) {
    try {
      luna = await Luna.connect();
      break;
    } catch (e) {
      $('status').textContent = e instanceof Luna.NotRunning ? 'waiting for LUNA...' : e.message;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  Luna.bindShortcuts(luna);
  $('mute').onclick = () => AddOnLogic.toggleSelectedMute(session);
  await luna.sessions.ready();
  luna.sessions.focused.onChange(bindSession);
  luna.sessions.items.onChange(bindSession);
  luna.status.onChange(() => {
    if (luna.status.value === 'disconnected') $('status').textContent = 'reconnecting...';
  });
  await bindSession();
}

connect();
