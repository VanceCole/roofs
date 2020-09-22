import RoofsLayer from './RoofsLayer.js';
import { log } from './helpers.js';

Hooks.once('init', async () => {
  log('Initializing', true);
  CONFIG.roofs = { debug: true };
  RoofsLayer._patchDrag();
  loadTemplates([
    'modules/roofs/templates/hud.hbs',
  ]);
});

Hooks.once('canvasInit', () => {
  // Add RoofsLayer to canvas
  let layerct;
  // eslint-disable-next-line no-restricted-syntax
  for (const [k, v] of Object.entries(canvas.stage.children)) {
    if (v.constructor.name === 'LightingLayer') layerct = k;
  }
  canvas.roofs = canvas.stage.addChildAt(new RoofsLayer(), layerct);
  canvas.app.ticker.add(RoofsLayer.tick);
});

Hooks.on('canvasReady', RoofsLayer.init);
Hooks.on('updateTile', RoofsLayer._onUpdateTile);
Hooks.on('preDeleteTile', RoofsLayer._onPreDeleteTile);
Hooks.on('renderTileHUD', RoofsLayer.extendTileHUD);

// Remember we need to patch Sight.update()
