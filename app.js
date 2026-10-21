const status = document.querySelector('#status');
const idleDelay = 5000;
let idleTimer;

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
