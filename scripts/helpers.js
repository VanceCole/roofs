export function log(data, force = false) {
  if (!force && CONFIG.roofs.debug === false) return;
  // eslint-disable-next-line no-console
  if (typeof data === 'string') console.log(`Roofs | ${data}`);
  // eslint-disable-next-line no-console
  else console.log(data);
}

/**
 * Converts the coordinates of a Point from one context to another
 *
 * @static
 * @param {PIXI.IPointData} point - The Point to convert
 * @param {PIXI.Container} context1 - The context the point is currently in
 * @param {PIXI.Container} context2 - The context to translate the point to
 * @return {PIXI.Point} A Point representing the coordinates in the second context
 * @memberof Translator
 */
export function translatePoint(point, context1, context2) {
  const pt = new PIXI.Container();
  context1.addChild(pt);
  pt.position.set(point.x, point.y);
  const tp = context2.toLocal(new PIXI.Point(), pt);
  context1.removeChild(pt);
  return tp;
}

/**
 * Gets a single pixel of texture data from GPU
 * @param target {Object} PIXI Object to read from
 * @param x {Integer}     X Position to read
 * @param y {Integer}     Y Position to read
 */
export function readPixel(target, x = 0, y = 0) {
  const { renderer } = canvas.app;
  let resolution;
  let renderTexture;
  let generated = false;
  let frame;
  if (target instanceof PIXI.RenderTexture) {
    renderTexture = target;
  }
  else {
    renderTexture = renderer.generateTexture(target);
    generated = true;
  }
  if (renderTexture) {
    resolution = renderTexture.baseTexture.resolution;
    frame = renderTexture.frame;
    renderer.renderTexture.bind(renderTexture);
  }
  else {
    resolution = renderer.resolution;
    frame = PIXI.TEMP_RECT;
    frame.width = renderer.width;
    frame.height = renderer.height;
    renderer.renderTexture.bind(null);
  }
  const pixel = new Uint8Array(4);
  // read pixels to the array
  const { gl } = renderer;
  gl.readPixels(x * resolution, y * resolution, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  if (generated) renderTexture.destroy(true);
  return pixel;
}
