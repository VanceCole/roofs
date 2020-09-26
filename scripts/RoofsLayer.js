import { log, translatePoint } from './helpers.js';

export default class RoofsLayer extends CanvasLayer {
  constructor() {
    super();
    this.sortableChildren = true;
  }

  static init() {
    log('Init RoofsLayer', true);
    canvas.tiles.placeables.forEach((t) => {
      if (t.getFlag('roofs', 'isRoof')) RoofsLayer.createRoof(t);
    });
  }

  /**
   * React to tile being sent from standard tile layer
   * @param {Object} tile   instance of Tile
   */
  static receiveTile(tile) {
    log(`Releasing tile ${tile.data._id}`);
    tile.setFlag('roofs', 'isRoof', true);
  }

  /**
   * Remove tile from our roof layer
   * @param {Object} tile   instance of Tile
   */
  static releaseTile(tile) {
    log(`Releasing tile ${tile.data._id}`);
    tile.setFlag('roofs', 'isRoof', false);
  }

  /**
   * Adds tile to tracked roofs
   * @param {Object} tile
   */
  static createRoof(tile) {
    log(`Creating roof for ${tile.data._id}`);
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
   * @param {Object} tile
   */
  static destroyRoof(tile) {
    tile.roof.sprite.destroy();
    tile.roof.container.destroy();
    delete tile.roof;
    tile.tile.alpha = 1;
  }

  /**
   * React to Hook 'preDeleteTile'
   * @param {Object} scene Scene Entity
   * @param {Object} data  Change data
   */
  static _onPreDeleteTile(scene, data) {
    const tile = canvas.tiles.get(data._id);
    if (!tile.roof) return;
    RoofsLayer.destroyRoof(tile);
  }

  /**
   * React to Hook 'UpdateTile'
   * @param {Object} scene Scene Entity
   * @param {Object} data  Change data
   */
  static _onUpdateTile(scene, data) {
    const tile = canvas.tiles.get(data._id);
    const isRoof = tile.getFlag('roofs', 'isRoof');
    if (isRoof && !tile.roof) RoofsLayer.createRoof(tile);
    else if (!isRoof && tile.roof) RoofsLayer.destroyRoof(tile);
    else if (isRoof) RoofsLayer.setTransform(tile);
  }

  static inBounds(tile, token) {
    const local = translatePoint({ x: token.data.x, y: token.data.y }, canvas.stage, tile);
    local.x += (token.data.width * canvas.grid.size) / 2;
    local.y += (token.data.height * canvas.grid.size) / 2;
    if (
      local.x > 0
      && local.y > 0
      && local.x < tile.width
      && local.y < tile.height
    ) return true;
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
      if (!tile.getFlag('roofs', 'isRoof')) return;
      // Find if any player token with obs is under roof
      const inBounds = canvas.tokens.placeables
        .filter((token) => token.observer && token.actor.isPC)
        .some((token) => RoofsLayer.inBounds(tile, token));
      // Set visibility & alpha
      const { container } = tile.roof;
      container.visible = true;
      if (tile.data.hidden) {
        if (game.user.isGM) container.alpha = 0.2;
        else container.visible = false;
      }
      else if (inBounds) container.alpha = 0.2;
      else if (game.user.isGM) container.alpha = tile.getFlag('roofs', 'gmOpacity') || 1;
      else container.alpha = tile.getFlag('roofs', 'plOpacity') || 0.8;
    });
  }

  /**
   * Set array of tiles visibility true
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
   * @param {Object} tile      (src) The Tile entity to update from
   * @param {Object} container (dest) The container holding the sprite
   * @param {Object} roof      (dest) PIXI.sprite to update
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
   * @param {Object} tile   Tile Object
   * @param {Object} html   jQuery selection
   * @param {Object} data   data prop of tile
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
