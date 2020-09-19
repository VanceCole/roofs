import RoofsLayer from './RoofsLayer.js';
import { log } from './helpers.js';

Hooks.once('init', async () => {
  CONFIG.roofs = {};
  log('Initializing', true);
});

Hooks.once('ready', async () => {
  log('Hello');
});

Hooks.once('canvasInit', () => {
  // Add RoofsLayer to canvas
  let layerct;

  // eslint-disable-next-line no-restricted-syntax
  for (const [k, v] of Object.entries(canvas.stage.children)) {
    if (v.constructor.name === 'LightingLayer') layerct = k;
  }
  canvas.roofs = canvas.stage.addChildAt(new RoofsLayer(), layerct);
});

Hooks.on('canvasInit', () => {
  canvas.roofs.init();
});

Hooks.on('renderTileHUD', extendTileHUD);

/**
 * Callback for renderTileHud
 * Adds roof buttons
 *
 * @param {Object} tile   Tile Object
 * @param {Object} html   jQuery selection
 * @param {Object} data   data prop of tile
 */
function extendTileHUD(hud, html, data) {
  console.log(hud);
  // Reference to the sprite of the tile
  const sprite = hud.object.tile.children[0];
  const left = html.find('.col.left');
  const myHtml = $(`
  <div class="control-icon send-to-roofs">
    <i class="fas fa-angle-up"></i>
  </div>
  <div class="control-icon send-to-tiles">
    <i class="fas fa-th-large"></i>
  </div>
  <div class="control-icon roofs-config">
    <i class="fas fa-cog"></i>
  </div>
  `);
  left.append(myHtml);
  html.find('.send-to-roofs').click(async () => {
    // Add flag to persist alpha state
    canvas.roofs.receiveTile(hud.object, data, sprite);
  });
  html.find('.send-to-tiles').click(() => {
    // Add flag to persist alpha state
    canvas.roofs.releaseTile(hud.object, data, sprite);
  });
  html.find('.roofs-config').click(() => {

  });
}

// Remember we need to patch Sight.update()
