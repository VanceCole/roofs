import { log, translatePoint, readPixel } from './helpers.js';

CONFIG.debug.roofs = true;

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
  static receiveTile(tile) {
    log(`Receiving tile ${tile.data._id}`);
    tile.setFlag('roofs', 'isRoof', true);
  }

  /**
   * Remove tile from our roof layer
   * @param {Tile} tile   instance of Tile
   */
  static releaseTile(tile) {
    log(`Releasing tile ${tile.data._id}`);
    tile.setFlag('roofs', 'isRoof', false);
  }

  /**
   * Adds tile to tracked roofs
   * @param {Tile} tile
   */
  static createRoof(tile) {
    log(`Creating roof ${tile.data._id}`);
    const container = new PIXI.Container();
    const sprite = PIXI.Sprite.from(tile.data.img);
    container.addChild(sprite);
    tile.roof = { container, sprite };
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
  }

  /**
   * Check if token is in bounds of given tile
   * @param {Tile}  tile
   * @param {Token} token
   */
  static inBounds(tile, token) {
    // Get local pos relative to tile
    const local = translatePoint({ x: token.data.x, y: token.data.y }, canvas.stage, tile);
    // Adjust pos to token center
    local.x += token.data.width * canvas.grid.size / 2;
    local.y += token.data.height * canvas.grid.size / 2;
    local.x = Math.round(local.x);
    local.y = Math.round(local.y);
    // Check if in bounds of the tile
    if (
      local.x > 0
      && local.y > 0
      && local.x < tile.width
      && local.y < tile.height
    ) {
      const pixel = readPixel(tile.roof.container, local.x, local.y);
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
   * For each tile in scene, check if is roof and if so, set alpha & vis
   */
  static setAlphas() {
    canvas.tiles.placeables.forEach((tile) => {
      // If this tile isnt a roof, do nothing
      if (!tile.roof) return;
      // Find if any player token with obs is under roof
      const inBounds = canvas.tokens.placeables
        .filter((token) => token.observer && token.actor.isPC)
        .some((token) => RoofsLayer.inBounds(tile, token));
      // Set visibility & alpha
      const { container } = tile.roof;
      container.visible = true;
      if (tile.data.hidden) {
        if (game.user.isGM) container.alpha = 0.3;
        else container.visible = false;
      }
      else if (inBounds) container.alpha = 0.3;
      else if (game.user.isGM) container.alpha = tile.getFlag('roofs', 'gmOpacity') || 0.8;
      else container.alpha = tile.getFlag('roofs', 'plOpacity') || 1;
    });
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
    const { container, sprite } = tile.roof;
    // Update container transform
    container.x = tile.x;
    container.y = tile.y;
    container.zIndex = tile.data.z;
    // Update sprite transform
    sprite.anchor.set(0.5);
    sprite.width = src.width;
    sprite.height = src.height;
    sprite.x = src.x;
    sprite.y = src.y;
    sprite.angle = src.angle;
    // Update visibility
    RoofsLayer.setAlphas();
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
  static async extendTileHUD(hud, html, data) {
    // Get props
    const tile = hud.object;
    const isRoof = tile.getFlag('roofs', 'isRoof');
    const gmOpacity = tile.getFlag('roofs', 'gmOpacity') || 0.8;
    const plOpacity = tile.getFlag('roofs', 'plOpacity') || 1;

    // Append template
    const form = await renderTemplate('/modules/roofs/templates/hud.hbs', { isRoof, gmOpacity, plOpacity });
    html.find('.col.left').append(form);

    // Add listeners
    html.find('.roof').click(() => {
      RoofsLayer.receiveTile(tile, data);
      html.find('.roof').addClass('active');
      html.find('.floor').removeClass('active');
    });
    html.find('.floor').click(() => {
      RoofsLayer.releaseTile(tile, data);
      html.find('.floor').addClass('active');
      html.find('.roof').removeClass('active');
    });
    html.find('.roofs-config').click(() => {});
    const gmSlider = html.find('input[name="gm-opacity"]');
    gmSlider.change(() => {
      const val = gmSlider[0].value;
      tile.setFlag('roofs', 'gmOpacity', val);
    });
    const plSlider = html.find('input[name="pl-opacity"]');
    plSlider.change(() => {
      const val = plSlider[0].value;
      tile.setFlag('roofs', 'plOpacity', val);
    });
  }
}
