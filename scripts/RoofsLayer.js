import { log, translatePoint, readPixel } from './helpers.js';

export default class RoofsLayer extends CanvasLayer {
  constructor() {
    super();
    this.sortableChildren = true;
  }

  static init() {
    log('Init RoofsLayer', true);
    canvas.tiles.placeables.forEach((tile) => {
      if (tile.getFlag('roofs', 'isRoof')) RoofsLayer.createRoof(tile);
    });
  }

  /**
   * React to tile being sent from standard tile layer
   * @param {Tile} tile   instance of Tile
   */
  static async receiveTile(tile) {
    log(`Receiving tile ${tile.data._id}`);
    await tile.setFlag('roofs', 'isRoof', true);
  }

  /**
   * Remove tile from our roof layer
   * @param {Tile} tile   instance of Tile
   */
  static async releaseTile(tile) {
    log(`Releasing tile ${tile.data._id}`);
    await tile.setFlag('roofs', 'isRoof', false);
  }

  /**
   * Toggle between open/closed/auto states
   * @param {Tile} tile  instance of Tile
   */
  static async toggleMode(tile) {
    let mode = tile.getFlag('roofs', 'mode');
    switch (mode) {
      case 'auto': mode = 'open';
        break;
      case 'open': mode = 'closed';
        break;
      default: mode = 'auto';
    }
    await tile.setFlag('roofs', 'mode', mode);
  }

  /**
   * Adds tile to tracked roofs
   * @param {Tile} tile
   */
  static createRoof(tile) {
    log(`Creating roof ${tile.data._id}`);
    const container = new PIXI.Container();
    const wrapper = new PIXI.Container();
    const sprite = PIXI.Sprite.from(tile.data.img);
    wrapper.addChild(sprite);
    container.addChild(wrapper);
    tile.roof = { container, wrapper, sprite };
    canvas.roofs.addChild(container);
    RoofsLayer.setTransform(tile);
    tile.tile.alpha = 0;
  }

  /**
   * Remove a tracked roof
   * @param {Tile} tile
   */
  static destroyRoof(tile) {
    log(`Destroying roof ${tile.data._id}`);
    tile.roof.sprite.destroy();
    tile.roof.container.destroy();
    delete tile.roof;
    tile.tile.alpha = 1;
  }

  /**
   * React to Hook 'preDeleteTile'
   * @param {Scene}  scene Scene Entity
   * @param {Object} data  Change data
   */
  static _onPreDeleteTile(scene, data) {
    const tile = canvas.tiles.get(data._id);
    if (!tile.roof) return;
    RoofsLayer.destroyRoof(tile);
  }

  /**
   * React to Hook 'UpdateTile'
   * @param {Scene}  scene Scene Entity
   * @param {Object} data  Change data
   */
  static _onUpdateTile(scene, data) {
    const tile = canvas.tiles.get(data._id);
    const isRoof = tile.getFlag('roofs', 'isRoof');
    // If isnt roof but is becoming one, createRoof
    if (isRoof && !tile.roof) RoofsLayer.createRoof(tile);
    // If was roof, but isn't now, destroyRoof
    else if (!isRoof && tile.roof) RoofsLayer.destroyRoof(tile);
    // Otherwise update existing roof
    else if (isRoof) RoofsLayer.setTransform(tile);
    RoofsLayer.setAlphas();
  }

  /**
   * React to hover of tile and peek if user is GM
   * @param {Tile} tile  Tile entity
   */
  static _onHoverTile(tile, state) {
    if (!game.settings.get('roofs', 'quickPeek')) return;
    if (!tile.getFlag('roofs', 'isRoof')) return;
    const { open } = RoofsLayer.getOpacity(tile);
    if (state) tile.roof.container.alpha = open;
    else RoofsLayer.setAlphas();
  }

  /**
   * Check if token is in bounds of given tile
   * @param {Tile}  tile
   * @param {Token} token
   */
  static inBounds(tile, token) {
    // Get canvas coords of token, accounting for token center
    const x = token.data.x + (token.data.width * canvas.grid.size / 2);
    const y = token.data.y + (token.data.height * canvas.grid.size / 2);
    // Get local pos relative to tile
    const local = translatePoint({ x, y }, canvas.stage, tile.roof.sprite);
    // Adjust local pos to account for centered anchor
    local.x = Math.round(local.x + tile.roof.sprite.width / 2);
    local.y = Math.round(local.y + tile.roof.sprite.height / 2);
    // Check if in bounds of the tile
    log(`Converted global (${x},${y}) to local (${local.x},${local.y})`);
    if (
      local.x > 0
      && local.y > 0
      && local.x < tile.roof.sprite.width
      && local.y < tile.roof.sprite.height
    ) {
      // Get alpha value of texture at coordinate
      const pixel = readPixel(tile.roof.wrapper, local.x, local.y);
      // Sometimes alpha value of 0 gets ceiled up to 1 so check if > 1 instead of 0
      if (pixel[3] > 1) return true;
    }
    return false;
  }

  /**
   * Checks if scene is active, if so dispatch setALphas()
   * @param {Scene} scene
   */
  static _onUpdateToken(scene) {
    if (!scene._view) return;
    RoofsLayer.setAlphas();
  }

  /**
   * Get current open / closed opacity values, or defaults if not set
   * @param {Tile} tile  Foundry Tile entity
   */
  static getOpacity(tile) {
    const open = tile.getFlag('roofs', 'open') ?? game.settings.get('roofs', 'defaultOpen');
    const closed = tile.getFlag('roofs', 'closed') ?? game.settings.get('roofs', 'defaultClosed');
    const mode = tile.getFlag('roofs', 'mode') ?? 'auto';
    return { open, closed, mode };
  }

  /**
   * For each tile in scene, check if is roof and if so, set alpha & vis
   */
  static setAlphas() {
    const t0 = performance.now();
    canvas.tiles.placeables.forEach((tile) => {
      // If this tile isnt a roof, do nothing
      if (!tile.roof) return;
      const { container } = tile.roof;
      const { open, closed, mode } = RoofsLayer.getOpacity(tile);
      // If tile is in closed mode, just make sure it's closed
      if (mode === 'closed') {
        tile.roof.state = true;
        container.alpha = closed;
        return;
      }
      // If tile is in open mode, just make sure it's open
      if (mode === 'open') {
        tile.roof.state = false;
        container.alpha = open;
        return;
      }
      // Otherwise perform automatic checks
      // Find if any token with obs is under roof
      const inBounds = canvas.tokens.placeables
        .filter((token) => token.observer)
        .some((token) => RoofsLayer.inBounds(tile, token));
      // Set visibility & alpha
      container.visible = true;
      if (tile.data.hidden) {
        tile.roof.state = false;
        if (game.user.isGM) container.alpha = open;
        else container.visible = false;
      }
      else if (inBounds) {
        tile.roof.state = false;
        container.alpha = open;
      }
      else {
        tile.roof.state = true;
        container.alpha = closed;
      }
    });
    const t1 = performance.now();
    log(`setAlphas took ${t1 - t0}ms.`);
    canvas.sight.update();
  }

  /**
   * Checks for tokens under closed roofs that player does not have observer on and hides them
   */
  static _sightUpdate() {
    const t0 = performance.now();
    if (!game.settings.get('roofs', 'autoHide')) return;
    canvas.tiles.placeables.forEach((tile) => {
      if (!tile.roof || !tile.roof.state || tile.hidden) return;
      canvas.tokens.placeables
        .filter((token) => !token.observer && token.visible && RoofsLayer.inBounds(tile, token))
        .forEach((token) => {
          token.visible = false;
        });
    });
    const t1 = performance.now();
    log(`sightUpdate took ${t1 - t0}ms.`);
  }

  /**
   * Set array of tiles visibility true
   * Mostly used when temp hiding tiles for drag ops etc
   * @param {Array} tiles   instance of Tile
   */
  static hide(tiles) {
    tiles.forEach((tile) => {
      if (!tile.roof) return;
      tile.roof.container.visible = false;
    });
  }

  /**
   * Set array of tiles visibility false
   * @param {Array} tiles   instance of Tile
   */
  static show(tiles) {
    tiles.forEach((tile) => {
      if (!tile.roof) return;
      tile.roof.container.visible = true;
    });
  }

  /**
   * Sync transforms between a given tile entity and sprite
   * @param {Tile}           tile      (src) The Tile entity to update from
   * @param {PIXI.Container} container (dest) The container holding the sprite
   * @param {PIXI.Sprite}    roof      (dest) PIXI.sprite to update
   */
  static setTransform(tile) {
    if (!tile || !tile.roof) return;
    const src = tile.tile.children[0];
    const { container, wrapper, sprite } = tile.roof;
    // Update container transform
    container.transform = tile.transform;
    container.zIndex = tile.data.z;
    wrapper.transform = src.transform;
    sprite.anchor.set(0.5);
    // Update visibility
    RoofsLayer.setAlphas();
  }

  static _patchSight() {
    if (game.data.version.startsWith('0.6')) {
      const origUpdate = canvas.sight.update;
      canvas.sight.update = function update(...args) {
        origUpdate.call(this, ...args);
        RoofsLayer._sightUpdate();
      };
      canvas.sight.update();
    }
    else {
      const origUpdate = canvas.sight.refresh;
      canvas.sight.refresh = function refresh(...args) {
        origUpdate.call(this, ...args);
        RoofsLayer._sightUpdate();
      };
      canvas.sight.refresh();
    }
  }

  /**
   * Patch drag handlers to hide roofs during drag ops
   */
  static _patchDrag() {
    // eslint-disable-next-line camelcase
    const og_onDragLeftStart = Tile.prototype._onDragLeftStart;
    Tile.prototype._onDragLeftStart = function _onDragLeftStart(event) {
      const targets = this.layer.options.controllableObjects ? this.layer.controlled : [this];
      RoofsLayer.hide(targets);
      og_onDragLeftStart.call(this, event);
    };

    // eslint-disable-next-line camelcase
    const og_onDragLeftDrop = Tile.prototype._onDragLeftDrop;
    Tile.prototype._onDragLeftDrop = function _onDragLeftDrop(event) {
      const targets = this.layer.options.controllableObjects ? this.layer.controlled : [this];
      RoofsLayer.show(targets);
      og_onDragLeftDrop.call(this, event);
    };

    // eslint-disable-next-line camelcase
    const og_onDragLeftCancel = Tile.prototype._onDragLeftCancel;
    Tile.prototype._onDragLeftCancel = function _onDragLeftCancel(event) {
      const targets = this.layer.options.controllableObjects ? this.layer.controlled : [this];
      RoofsLayer.show(targets);
      og_onDragLeftCancel.call(this, event);
    };
  }

  /**
   * Callback for renderTileHud
   * Adds roof buttons
   * @param {Object} hud    HUD Object for the tile Object
   * @param {Object} html   jQuery selection of HTML to be rendered
   * @param {Object} data   data prop passed to HUD
   */
  static async extendTileHUD(hud, html) {
    // Get props
    const tile = hud.object;
    const isRoof = tile.getFlag('roofs', 'isRoof');
    const { open, closed, mode } = RoofsLayer.getOpacity(tile);

    // Append template
    const form = await renderTemplate('/modules/roofs/templates/hud.hbs', { isRoof, open, closed, mode });
    html.find('.col.left').append(form);

    // Send to roof
    html.find('.roof').click(async () => {
      await RoofsLayer.receiveTile(tile);
      hud.render();
    });
    // Send to floor
    html.find('.floor').click(async () => {
      await RoofsLayer.releaseTile(tile);
      hud.render();
    });
    // Toggle mode
    html.find('.mode').click(async () => {
      await RoofsLayer.toggleMode(tile);
      hud.render();
    });
    // open state opacity slider
    const openSlider = html.find('input[name="open"]');
    openSlider.change(() => {
      const val = parseFloat(openSlider[0].value);
      tile.setFlag('roofs', 'open', val);
    });
    // closed state opacity slider
    const closedSlider = html.find('input[name="closed"]');
    closedSlider.change(() => {
      const val = parseFloat(closedSlider[0].value);
      tile.setFlag('roofs', 'closed', val);
    });
  }
}
