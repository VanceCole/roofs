export function log(data, force = false) {
  if (!force && CONFIG.roofs.debug === false) return;
  // eslint-disable-next-line no-console
  if (typeof data === 'string') console.log(`Roofs | ${data}`);
  // eslint-disable-next-line no-console
  else console.log(data);
}

export function temp() {

}
