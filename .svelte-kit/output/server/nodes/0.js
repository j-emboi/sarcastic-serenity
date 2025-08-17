

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.CNFx7X-5.js","_app/immutable/chunks/Cm9PB-7n.js","_app/immutable/chunks/CG9XQoTv.js","_app/immutable/chunks/BXzMPvj7.js"];
export const stylesheets = ["_app/immutable/assets/0.DaFUWQgd.css"];
export const fonts = [];
