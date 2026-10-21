const status = document.querySelector('#status');
const idleDelay = 5000;
let idleTimer;

const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
const connection = navigator.connection;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const displayPreferences = {
  contrast: window.matchMedia('(prefers-contrast: more)'),
  forced: window.matchMedia('(forced-colors: active)'),
  inverted: window.matchMedia('(inverted-colors: inverted)'),
  pointer: window.matchMedia('(pointer: fine)'),
  coarse: window.matchMedia('(pointer: coarse)'),
  gamut: window.matchMedia('(color-gamut: p3)')
};

function utcOffset() {
  const minutes = -new Date().getTimezoneOffset();
  return `UTC${minutes >= 0 ? '+' : '-'}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`;
}

function browserDescription() {
  const agent = navigator.userAgent || '';
  const browsers = [
    ['Edge', /Edg(?:A|iOS)?\/([\d.]+)/],
    ['Opera', /(?:OPR|Opera)\/([\d.]+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
    ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari/]
  ];
  for (const [name, pattern] of browsers) {
    const match = agent.match(pattern);
    if (match) return `${name} ${match[1]} (reported)`;
  }
  return 'Unknown';
}

function graphicsDescription() {
  // Read once; privacy settings may hide the renderer or disable WebGL.
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return 'Unavailable';
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return renderer || 'Unavailable';
  } catch {
    return 'Unavailable';
  }
}

const graphics = graphicsDescription();

function updateBrowserInfo() {
  const details = {
    browser: browserDescription(),
    platform: navigator.userAgentData?.platform || navigator.platform || 'Unavailable',
    agent: navigator.userAgent || 'Unavailable',
    plugins: Array.from(navigator.plugins || [], plugin => plugin.name).join(', ') || 'None exposed',
    graphics,
    memory: navigator.deviceMemory == null ? 'Unavailable' : `≈ ${navigator.deviceMemory} GiB (reported)`,
    screen: `${window.screen.width} × ${window.screen.height}`,
    available: `${window.screen.availWidth} × ${window.screen.availHeight}`,
    color: window.screen.colorDepth == null ? 'Unavailable' : `${window.screen.colorDepth}-bit`,
    window: `${window.innerWidth} × ${window.innerHeight}`,
    pixels: `${window.devicePixelRatio || 1}× density`,
    orientation: window.screen.orientation?.type || 'Unavailable',
    cpu: navigator.hardwareConcurrency ?? 'Unavailable',
    touch: navigator.maxTouchPoints ?? 'Unavailable',
    language: navigator.language || 'Unavailable',
    languages: navigator.languages?.join(', ') || 'Unavailable',
    network: navigator.onLine ? 'Online' : 'Offline',
    connection: connection?.effectiveType || 'Unavailable',
    downlink: connection?.downlink == null ? 'Unavailable' : `≈ ${connection.downlink} Mbps`,
    latency: connection?.rtt == null ? 'Unavailable' : `≈ ${connection.rtt} ms`,
    saver: connection?.saveData == null ? 'Unavailable' : connection.saveData ? 'On' : 'Off',
    referrer: document.referrer || 'Not shared',
    cookies: navigator.cookieEnabled == null ? 'Unavailable' : navigator.cookieEnabled ? 'Enabled (reported)' : 'Disabled (reported)',
    pdf: navigator.pdfViewerEnabled == null ? 'Unavailable' : navigator.pdfViewerEnabled ? 'Supported' : 'Not supported',
    automation: navigator.webdriver == null ? 'Unavailable' : navigator.webdriver ? 'Reported' : 'Not reported',
    dnt: navigator.doNotTrack === '1' ? 'Requested' : navigator.doNotTrack === '0' ? 'Not requested' : 'Not reported',
    gpc: navigator.globalPrivacyControl == null ? 'Not reported' : navigator.globalPrivacyControl ? 'On' : 'Off',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unavailable',
    offset: utcOffset(),
    appearance: darkMode.matches ? 'Dark' : 'Light',
    motion: reducedMotion.matches ? 'Reduce' : 'No preference',
    contrast: displayPreferences.contrast.matches ? 'More' : 'No “more” preference reported',
    forced: displayPreferences.forced.matches ? 'Active' : 'Not active / unsupported',
    inverted: displayPreferences.inverted.matches ? 'Inverted' : 'Not inverted / unsupported',
    pointer: displayPreferences.pointer.matches ? 'Fine (mouse / trackpad)' : displayPreferences.coarse.matches ? 'Coarse (touch)' : 'None / unavailable',
    gamut: displayPreferences.gamut.matches ? 'P3 or wider' : 'sRGB / unavailable'
  };
  for (const [name, value] of Object.entries(details)) {
    document.querySelector(`#info-${name}`).textContent = value;
  }
}

updateBrowserInfo();
for (const type of ['resize', 'online', 'offline', 'focus', 'languagechange']) {
  window.addEventListener(type, updateBrowserInfo);
}
window.screen.orientation?.addEventListener('change', updateBrowserInfo);
darkMode.addEventListener('change', updateBrowserInfo);
reducedMotion.addEventListener('change', updateBrowserInfo);
connection?.addEventListener('change', updateBrowserInfo);
for (const preference of Object.values(displayPreferences)) {
  preference.addEventListener('change', updateBrowserInfo);
}

function updateVoices() {
  const voices = window.speechSynthesis?.getVoices();
  document.querySelector('#info-voices').textContent = voices
    ? voices.length ? `${voices.length}: ${voices.map(voice => `${voice.name} (${voice.lang})`).join(', ')}` : 'None exposed / not loaded'
    : 'Unavailable';
}
updateVoices();
window.speechSynthesis?.addEventListener('voiceschanged', updateVoices);

async function readOptionalInfo(name, read) {
  try {
    document.querySelector(`#info-${name}`).textContent = await read();
  } catch {
    document.querySelector(`#info-${name}`).textContent = 'Unavailable';
  }
}

readOptionalInfo('storage', async () => {
  const { usage, quota } = await navigator.storage.estimate();
  const mib = bytes => Number.isFinite(bytes) ? `${(bytes / 1024 ** 2).toFixed(1)} MiB` : 'Unavailable';
  return `${mib(usage)} used / ${mib(quota)} quota (estimate)`;
});
readOptionalInfo('battery', async () => {
  const battery = await navigator.getBattery();
  const update = () => {
    document.querySelector('#info-battery').textContent = `${Math.round(battery.level * 100)}% (${battery.charging ? 'charging / plugged in' : 'discharging'})`;
  };
  battery.addEventListener('levelchange', update);
  battery.addEventListener('chargingchange', update);
  update();
  return document.querySelector('#info-battery').textContent;
});

function updateDeviceCounts() {
  if (document.hidden) return;
  readOptionalInfo('devices', async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const count = kind => devices.filter(device => device.kind === kind).length;
    return `${count('videoinput')} cameras, ${count('audioinput')} mics, ${count('audiooutput')} speakers exposed (may be incomplete)`;
  });
}
updateDeviceCounts();
navigator.mediaDevices?.addEventListener('devicechange', updateDeviceCounts);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateDeviceCounts();
});

for (const name of ['geolocation', 'notifications', 'camera', 'microphone', 'midi']) {
  readOptionalInfo(`permission-${name}`, async () => {
    // Query existing state only; never request access or activate a device.
    const permission = await navigator.permissions.query({ name });
    const label = () => permission.state === 'prompt' ? 'Ask if used' : permission.state;
    permission.addEventListener('change', () => {
      document.querySelector(`#info-permission-${name}`).textContent = label();
    });
    return label();
  });
}

const locationRequest = document.querySelector('#location-request');
const locationInfo = document.querySelector('#info-location');
if (!navigator.geolocation || !window.isSecureContext) {
  locationRequest.hidden = true;
  locationInfo.textContent = 'Unavailable';
}
locationRequest.addEventListener('click', () => {
  locationRequest.hidden = true;
  locationInfo.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude, accuracy } = position.coords;
    locationInfo.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${Math.round(accuracy)} m)`;
  }, error => {
    locationInfo.textContent = error.code === 1 ? 'Permission denied' : 'Unavailable';
    locationRequest.hidden = false;
    locationRequest.textContent = 'Try again';
    locationInfo.textContent = ` — ${locationInfo.textContent}`;
  }, { timeout: 10000, maximumAge: 60000 });
});

function isAway() {
  return document.hidden || !document.hasFocus();
}

function show(message) {
  // Avoid repeated live-region announcements for the same activity.
  if (status.textContent !== message) status.textContent = message;
}

function restartIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!isAway()) show("It's quiet. Still there?");
  }, idleDelay);
}

function onActivity(message) {
  if (isAway()) return;
  show(message);
  restartIdleTimer();
}

function onPresenceChange() {
  clearTimeout(idleTimer);
  if (isAway()) {
    show('You left the tab.');
  } else {
    show('Welcome back.');
    restartIdleTimer();
  }
}

const mouseButtons = ['Left', 'Middle', 'Right', 'Back', 'Forward'];
const heldButtons = [[1, 'left'], [2, 'right'], [4, 'middle'], [8, 'back'], [16, 'forward']];

function keyDescription(event) {
  const key = event.key === ' ' ? 'Space' : event.key;
  const modifiers = [
    ['ctrlKey', 'Ctrl', 'Control'],
    ['altKey', 'Alt', 'Alt'],
    ['shiftKey', 'Shift', 'Shift'],
    ['metaKey', 'Meta', 'Meta']
  ].filter(([property, , value]) => event[property] && event.key !== value)
    .map(([, label]) => label);
  return [...modifiers, key].join(' + ') + ` (${event.code || 'code unavailable'})`;
}

window.addEventListener('keydown', event => {
  onActivity(`${event.repeat ? 'Holding' : 'Pressed'}: ${keyDescription(event)}`);
});
window.addEventListener('keyup', event => {
  onActivity(`Released: ${keyDescription(event)}`);
});
window.addEventListener('pointermove', event => {
  const buttons = heldButtons.filter(([mask]) => event.buttons & mask)
    .map(([, name]) => name);
  const action = event.pointerType === 'touch' ? 'Touch moving'
    : buttons.length ? `Dragging (${buttons.join(' + ')})` : 'Pointer moving';
  onActivity(`${action}: x ${Math.round(event.clientX)}, y ${Math.round(event.clientY)}`);
}, { passive: true });
for (const type of ['pointerdown', 'pointerup']) {
  window.addEventListener(type, event => {
    const action = type === 'pointerdown' ? 'pressed' : 'released';
    const input = event.pointerType === 'touch' ? 'Touch'
      : `${mouseButtons[event.button] || `Button ${event.button}`} ${event.pointerType || 'mouse'} button`;
    onActivity(`${input} ${action}`);
  }, { passive: true });
}
window.addEventListener('dblclick', () => onActivity('Left mouse double-click'));
window.addEventListener('wheel', event => {
  const directions = [];
  if (event.deltaY) directions.push(event.deltaY > 0 ? 'down' : 'up');
  if (event.deltaX) directions.push(event.deltaX > 0 ? 'right' : 'left');
  if (directions.length) onActivity(`Scrolling ${directions.join(' + ')}`);
}, { passive: true });
window.addEventListener('blur', onPresenceChange);
window.addEventListener('focus', onPresenceChange);
document.addEventListener('visibilitychange', onPresenceChange);

if (isAway()) onPresenceChange();
else restartIdleTimer();
