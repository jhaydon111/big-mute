// Big Mute: logic that does not touch the DOM, so tests can exercise it against Luna.MockEngine.
// The "selected track" is session.focusedTrack: LUNA's last selected track, else the first
// selected track, else the first visible track.

const AddOnLogic = {
  /** What the big button shows for the selected track. */
  buttonState(session) {
    const track = session?.focusedTrack.value;
    if (!track) return { trackId: null, name: 'No track', muted: false, enabled: false };
    return { trackId: track.id, name: track.name.value ?? track.id, muted: track.mute.on, enabled: true };
  },

  /** Toggle mute on the selected track. One click = one write, which the SDK touches and releases. */
  async toggleSelectedMute(session) {
    const track = session?.focusedTrack.value;
    if (!track) return false;
    await track.loadStrip();
    await track.mute.toggle();
    return true;
  },
};

globalThis.AddOnLogic = AddOnLogic;
