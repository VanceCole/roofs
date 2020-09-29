export default async function config() {
  CONFIG.roofs = { debug: false };
  game.settings.register('roofs', 'defaultClosed', {
    name: game.i18n.localize('ROOFS.defaultClosed'),
    hint: game.i18n.localize('ROOFS.defaultClosedHint'),
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
    name: game.i18n.localize('ROOFS.defaultOpen'),
    hint: game.i18n.localize('ROOFS.defaultOpenHint'),
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
    name: game.i18n.localize('ROOFS.autoHide'),
    hint: game.i18n.localize('ROOFS.autoHideHint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register('roofs', 'quickPeek', {
    name: game.i18n.localize('ROOFS.quickPeek'),
    hint: game.i18n.localize('ROOFS.quickPeekHint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
}
