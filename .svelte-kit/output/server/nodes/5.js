

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/tables/_page.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "load": null
};
export const universal_id = "src/routes/tables/+page.js";
export const imports = ["_app/immutable/nodes/5.BzmhyfpZ.js","_app/immutable/chunks/BfJ4JsVu.js","_app/immutable/chunks/D6bvHR5w.js","_app/immutable/chunks/B-pWAizt.js","_app/immutable/chunks/BU6AHVGu.js","_app/immutable/chunks/ctECQmNr.js","_app/immutable/chunks/BHGhXssE.js","_app/immutable/chunks/wctgZPgD.js","_app/immutable/chunks/BGyKv7BH.js","_app/immutable/chunks/DDve7vYC.js","_app/immutable/chunks/DGqvvCop.js"];
export const stylesheets = [];
export const fonts = [];
