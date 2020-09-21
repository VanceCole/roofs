import { log } from './helpers.js';

export default class RoofsLayer extends CanvasLayer {
  async init() {
    log('Init RoofsLayer', true);
    this.containers = {};

    const active = canvas.scene.getFlag('roofs', 'active');
    if (!active) return;

    /**
     * Load any existing tracked roofs
     */
    // eslint-disable-next-line no-restricted-syntax
    Object.keys(active).forEach((k) => {
      const tile = canvas.tiles.get(k);
      if (tile) this.createRoof(tile);
    });
  }

  static tick() {
    const containers = canvas?.roofs?.containers;
    if (containers === undefined) return;
    const keys = Object.keys(containers);
    if (!keys.length) return;
    keys.forEach((k) => {
      const tile = canvas.tiles.get(k);
      const { container, sprite } = containers[k];
      RoofsLayer.setTransform(tile, container, sprite);
    });
  }

  /**
   * Adds tile to tracked roofs
   * @param {Object} tile
   */
  createRoof(tile) {
    const id = tile.data._id;
    log(`Creating roof for ${id}`);
    // Make new container
    this.containers[id] = {};
    const container = new PIXI.Container();
    this.containers[id].container = container;

    // Make new sprite
    const sprite = PIXI.Sprite.from(tile.data.img);
    this.containers[id].sprite = sprite;

    // Add objects to parents
    container.addChild(sprite);
    this.addChild(container);

    // Update transforms
    RoofsLayer.setTransform(tile, container, sprite);
  }

  /**
   * Remove a tracked roof
   * @param {String} id The tile ID
   */
  destroyRoof(id) {
    // destroy container
    this.containers[id].container.destroy();
    // remove from active containers
    delete this.containers[id];
  }

  static deleteTile(scene, data) {
    if (!canvas.roofs.containers[data._id]) return;
    canvas.roofs.destroyRoof(data._id);
  }

  _updateTile(scene, data) {}

  /**
   * React to change in flags
   * @param {Object} scene scene entity
   * @param {Object} data  data that was changed
   */
  _updateScene(scene, data) {
    // Check if update applies to current viewed scene
    if (!scene._view) return;
    // React to change in actively tracked roofs
    if (!hasProperty(data, 'flags.roofs.active')) return;

    // For each changed roof
    Object.keys(data.flags.roofs.active).forEach((r) => {
      // Check if roof removed
      if (r.startsWith('-=')) {
        const id = r.substr(2);
        this.destroyRoof(id);
      }
      // Otherwise, add new roof
      else {
        const id = r;
        const tile = canvas.tiles.get(id);
        this.createRoof(tile);
      }
    });
  }

  /**
   * Sync transforms between a given tile entity and sprite
   * @param {Object} tile      (src) The Tile entity to update from
   * @param {Object} container (dest) The container holding the sprite
   * @param {Object} roof      (dest) PIXI.sprite to update
   */
  static setTransform(tile, container, sprite) {
    if (!tile || !sprite || !container?.transform) return;
    const src = tile.tile.children[0];
    // Update container transform
    container.x = tile.x;
    container.y = tile.y;
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
   * @param {Object} data   Tile.data
   */
  static receiveTile(tile) {
    const id = tile.data._id;
    log(`Releasing tile ${id}`);
    // Set flag that this is a roof now
    canvas.scene.setFlag('roofs', `active.${id}`, {});
  }

  /**
   * Remove tile from our roof layer
   * @param {Object} tile   instance of Tile
   * @param {Object} data   Tile.data
   */
  static releaseTile(tile) {
    const id = tile.data._id;
    log(`Releasing tile ${id}`);
    canvas.scene.setFlag('roofs', `active.-=${id}`, null);
  }

  static hide(targets) {
    const tgs = targets.map((t) => t.id);
    const containers = canvas?.roofs?.containers;
    if (containers === undefined) return;
    const keys = Object.keys(containers).filter((k) => tgs.includes(k));
    if (!keys.length) return;
    keys.forEach((k) => {
      containers[k].sprite.visible = false;
    });
  }

  static show(targets) {
    const tgs = targets.map((t) => t.id);
    const containers = canvas?.roofs?.containers;
    if (containers === undefined) return;
    const keys = Object.keys(containers).filter((k) => tgs.includes(k));
    if (!keys.length) return;
    keys.forEach((k) => {
      containers[k].sprite.visible = true;
    });
  }

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
}
