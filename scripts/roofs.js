import RoofsLayer from './RoofsLayer.js';
import config from './config.js';
import { log } from './helpers.js';

Hooks.once('init', async () => {
  log('Initializing', true);
  config();
  RoofsLayer._patchDrag();
  loadTemplates([
    'modules/roofs/templates/hud.hbs',
  ]);
});

Hooks.once('canvasInit', () => {
  // Add RoofsLayer to canvas
  const index = canvas.stage.getChildIndex(canvas.lighting);
  canvas.roofs = canvas.stage.addChildAt(new RoofsLayer(), index);
});

Hooks.on('canvasReady', RoofsLayer.init);
Hooks.on('updateTile', RoofsLayer._onUpdateTile);
Hooks.on('preDeleteTile', RoofsLayer._onPreDeleteTile);
Hooks.on('renderTileHUD', RoofsLayer.extendTileHUD);
Hooks.on('updateToken', RoofsLayer._onUpdateToken);
Hooks.on('hoverTile', RoofsLayer._onHoverTile);

// Remember we need to patch Sight.update()
