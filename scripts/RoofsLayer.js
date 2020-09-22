import { log } from './helpers.js';

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
  }

  /**
   * Remove a tracked roof
   * @param {Object} tile
   */
  static destroyRoof(tile) {
    tile.roof.sprite.destroy();
    tile.roof.container.destroy();
    delete tile.roof;
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
    console.log(data);
    const tile = canvas.tiles.get(data._id);
    const isRoof = tile.getFlag('roofs', 'isRoof');
    if (isRoof && !tile.roof) RoofsLayer.createRoof(tile);
    else if (!isRoof && tile.roof) RoofsLayer.destroyRoof(tile);
    else if (isRoof) RoofsLayer.setTransform(tile);
  }

  /**
   * Sync transforms between a given tile entity and sprite
   * @param {Object} tile      (src) The Tile entity to update from
   * @param {Object} container (dest) The container holding the sprite
   * @param {Object} roof      (dest) PIXI.sprite to update
   */
  static setTransform(tile) {
    console.log(tile);
    if (!tile || !tile.roof) return;
    const src = tile.tile.children[0];
    const { container, sprite } = tile.roof;

    // Update container transform
    container.x = tile.x;
    container.y = tile.y;
    container.zIndex = tile.data.z;
    container.visible = !tile.data.hidden;
    // Update sprite transform
    sprite.anchor.set(0.5);
    sprite.width = src.width;
    sprite.height = src.height;
    sprite.x = src.x;
    sprite.y = src.y;
    sprite.angle = src.angle;
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
    // Reference to the sprite of the tile
    const left = html.find('.col.left');
    const myHtml = await renderTemplate('/modules/roofs/templates/hud.hbs');
    left.append(myHtml);
    html.find('.send-to-roofs').click(() => {
      RoofsLayer.receiveTile(hud.object, data);
    });
    html.find('.send-to-tiles').click(() => {
      RoofsLayer.releaseTile(hud.object, data);
    });
    html.find('.roofs-config').click(() => {

    });
  }
}
