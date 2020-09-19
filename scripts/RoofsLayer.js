import { log } from './helpers.js';

export default class RoofsLayer extends CanvasLayer {
  async init() {
    log('Init RoofsLayer', true);
    this.containers = {};

    const active = canvas.scene.getFlag('roofs', 'active');
    if (!active) return;
    // eslint-disable-next-line no-restricted-syntax
    Object.keys(active).forEach(k => {
      console.log(k);
      const tile = canvas.tiles.get(k);
      console.log(tile);
      if (tile) this.createRoof(tile);
    });
  }

  createRoof(tile) {
    const id = tile.data._id;
    log(`Creating roof for ${id}`);
    // Make new container
    this.containers[id] = {};
    const container = new PIXI.Container();
    this.containers[id].container = container;
    container.x = tile.x;
    container.y = tile.y;
    const roofSprite = PIXI.Sprite.from(tile.data.img);

    // Add stuff to parents
    container.addChild(roofSprite);
    this.addChild(container);
    RoofsLayer.setTransform(tile, roofSprite);
  }

  destroyRoof(id) {
    // destroy container
    this.containers[id].container.destroy();
    // remove from active containers
    delete this.containers[id];
  }

  _updateScene(scene, data) {
    // Check if update applies to current viewed scene
    if (!scene._view) return;
    // React to visibility change
    if (!hasProperty(data, 'flags.roofs.active')) return;
    Object.keys(data.flags.roofs.active).forEach((r) => {
      if (r.startsWith('-=')) {
        const id = r.substr(2);
        this.destroyRoof(id);
      }
      else {
        const id = r;
        const tile = canvas.tiles.get(id);
        this.createRoof(tile);
      }
    });
  }

    // // Add roof to active containers
    // this.createRoof(tile);

  static setTransform(tile, roofSprite) {
    const sprite = tile.tile.children[0];
    // Make new sprite
    roofSprite.anchor.set(0.5);
    roofSprite.width = sprite.width;
    roofSprite.height = sprite.height;
    roofSprite.x = sprite.x;
    roofSprite.y = sprite.y;
    roofSprite.angle = sprite.angle;
  }

  /**
   * React to tile being sent from standard tile layer
   * @param {Object} tile   instance of Tile
   * @param {Object} data   Tile.data
   */
  receiveTile(tile) {
    console.log('receiving tile');

    const id = tile.data._id;
    // Set flag that this is a roof now
    canvas.scene.setFlag('roofs', `active.${id}`, {});
  }

  /**
   * Remove tile from our roof layer
   * @param {Object} tile   instance of Tile
   * @param {Object} data   Tile.data
   */
  async releaseTile(tile, data) {
    console.log('releasing tile');

    const id = tile.data._id;

    // Atro method actually
    canvas.scene.setFlag('roofs', `active.-=${id}`, null);
  }
}
