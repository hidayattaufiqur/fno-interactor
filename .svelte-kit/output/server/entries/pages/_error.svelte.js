import { b as escape_html, a as store_get, u as unsubscribe_stores } from "../../chunks/renderer.js";
import { p as page } from "../../chunks/stores.js";
function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<div class="error-page svelte-1j96wlh"><p class="eyebrow">Error ${escape_html(store_get($$store_subs ??= {}, "$page", page).status)}</p> <h2>${escape_html(store_get($$store_subs ??= {}, "$page", page).error?.message ?? "Something went wrong")}</h2> <a href="/" class="nav-link">← Back to home</a></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _error as default
};
