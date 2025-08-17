

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.gDRHlHTM.js","_app/immutable/chunks/Cm9PB-7n.js","_app/immutable/chunks/0VPK0fgq.js","_app/immutable/chunks/MtkZ8ZIf.js"];
export const stylesheets = ["_app/immutable/assets/0.BP55arkB.css"];
export const fonts = [];
