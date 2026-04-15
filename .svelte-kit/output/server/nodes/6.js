

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/tables/_name_/_page.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false,
  "load": null
};
export const universal_id = "src/routes/tables/[name]/+page.js";
export const imports = ["_app/immutable/nodes/6.Cau54rc0.js","_app/immutable/chunks/BfJ4JsVu.js","_app/immutable/chunks/CQG01CFa.js","_app/immutable/chunks/CWeFt6jb.js","_app/immutable/chunks/D6bvHR5w.js","_app/immutable/chunks/B-pWAizt.js","_app/immutable/chunks/BU6AHVGu.js","_app/immutable/chunks/ctECQmNr.js","_app/immutable/chunks/BHGhXssE.js","_app/immutable/chunks/wctgZPgD.js","_app/immutable/chunks/BGyKv7BH.js","_app/immutable/chunks/DDve7vYC.js","_app/immutable/chunks/CJ8GHc5w.js"];
export const stylesheets = [];
export const fonts = [];
