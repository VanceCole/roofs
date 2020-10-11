export default async function config() {
  CONFIG.roofs = { debug: false };
  game.settings.register('roofs', 'defaultClosed', {
    name: 'ROOFS.defaultClosed',
    hint: 'ROOFS.defaultClosedHint',
    scope: 'world',
    config: true,
    type: Number,
    default: 1,
    range: {
      min: 0,
      max: 1,
      step: 0.1,
    },
  });
  game.settings.register('roofs', 'defaultOpen', {
    name: 'ROOFS.defaultOpen',
    hint: 'ROOFS.defaultOpenHint',
    scope: 'world',
    config: true,
    type: Number,
    default: 0.2,
    range: {
      min: 0,
      max: 1,
      step: 0.1,
    },
  });
  game.settings.register('roofs', 'autoHide', {
    name: 'ROOFS.autoHide',
    hint: 'ROOFS.autoHideHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register('roofs', 'quickPeek', {
    name: 'ROOFS.quickPeek',
    hint: 'ROOFS.quickPeekHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
}
