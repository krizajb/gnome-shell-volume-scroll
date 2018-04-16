const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const Volume = imports.ui.status.volume;
const Gio = imports.gi.Gio;

const VOL_ICONS = [
    'audio-volume-muted-symbolic',
    'audio-volume-low-symbolic',
    'audio-volume-medium-symbolic',
    'audio-volume-high-symbolic'
];

let panel,
    panelBinding,
    volumeControl,
    volumeStep;

function init() {
  volumeControl = Volume.getMixerControl();
  volumeStep = 500;

  panel = Main.panel;
  panelBinding = null;
}

function enable() {
  panel.reactive = true;
  if (panelBinding) {
    disable();
  }
  panelBinding = panel.actor.connect('scroll-event',_onScroll);
}

function disable() {
  if (panelBinding) {
    panel.actor.disconnect(panelBinding);
    panelBinding = null;
  }
}

/**
 * Returns the max volume.
 */
function _getVolumeMax() {
  return volumeControl.get_vol_max_norm();
  //return volumeControl.get_vol_max_amplified();  // boost volume (150%)
}

/**
 * Handles panel mouse scroll event.
 */
function _onScroll(actor, event) {
  let volume = volumeControl.get_default_sink().volume;

  switch(event.get_scroll_direction()) {
    case Clutter.ScrollDirection.UP:
      volume += volumeStep;
      break;
    case Clutter.ScrollDirection.DOWN:
      volume -= volumeStep;
      break;
    default:
      return Clutter.EVENT_PROPAGATE;
  }

  if (volume > _getVolumeMax()) {
    volume = _getVolumeMax();
  }
  else if (volume < volumeStep) {
    volume = 0;
  }

  volumeControl.get_default_sink().volume = volume;
  volumeControl.get_default_sink().push_volume();

  _showVolumeOsd(volume, volume/_getVolumeMax() * 100);

  return Clutter.EVENT_STOP;
}

/**
 * Shows the current volume on OSD.
 *
 * @see gsd-media-keys-manager.c
 */
function _showVolumeOsd (level, percent) {
  let monitor = -1;
  let n;

  if (level === 0) {
      n = 0;
  } else {
      n = parseInt(3 * percent / 100 + 1);
      n = Math.max(1, n);
      n = Math.min(3, n);
  }

  let icon = Gio.Icon.new_for_string(VOL_ICONS[n]);

  Main.osdWindowManager.show(monitor, icon, null, percent);
}