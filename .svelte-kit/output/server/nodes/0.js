

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.CIWeBtTH.js","_app/immutable/chunks/D6bvHR5w.js","_app/immutable/chunks/B-pWAizt.js","_app/immutable/chunks/BU6AHVGu.js","_app/immutable/chunks/ctECQmNr.js","_app/immutable/chunks/CJ8GHc5w.js","_app/immutable/chunks/XKVcxF_N.js","_app/immutable/chunks/wctgZPgD.js","_app/immutable/chunks/BGyKv7BH.js","_app/immutable/chunks/QKOHclx5.js","_app/immutable/chunks/2SIwc9jD.js","_app/immutable/chunks/CWeFt6jb.js","_app/immutable/chunks/CXlT1r-0.js","_app/immutable/chunks/BfJ4JsVu.js"];
export const stylesheets = ["_app/immutable/assets/0.B-mWQbVA.css"];
export const fonts = [];
