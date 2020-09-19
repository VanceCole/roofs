export default class RoofsLayer extends CanvasLayer {
  async init() {
    this.containers = {};
    console.log('Init RoofsLayer');
  }

  /**
   * React to tile being sent from standard tile layer
   * @param {Object} tile   instance of Tile
   * @param {Object} data   Tile.data
   */
  receiveTile(tile, data, sprite) {
    console.log('receiving tile');
    // Add roof to active containers
    this.containers[tile.data._id] = {};

    // Make new container
    const container = new PIXI.Container();
    this.containers[tile.data._id].container = container;
    container.x = tile.x;
    container.y = tile.y;

    // Make new sprite
    const newsprite = PIXI.Sprite.from(tile.data.img);
    newsprite.anchor.set(0.5);
    newsprite.width = sprite.width;
    newsprite.height = sprite.height;
    newsprite.x = sprite.x;
    newsprite.y = sprite.y;
    newsprite.angle = sprite.angle;

    // Add stuff to parents
    container.addChild(newsprite);
    this.addChild(container);
  }

  /**
   * Remove tile from our roof layer
   * @param {Object} tile   instance of Tile
   * @param {Object} data   Tile.data
   */
  releaseTile(tile, data) {
    console.log('releasing tile');

    // destroy container
    this.containers[tile.data._id].container.destroy();
    // remove from active containers
    delete this.containers[tile.data._id];
  }
}
