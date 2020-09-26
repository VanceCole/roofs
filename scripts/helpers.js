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
