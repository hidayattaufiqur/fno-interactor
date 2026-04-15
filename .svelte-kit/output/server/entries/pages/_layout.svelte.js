import { a as store_get, e as ensure_array_like, b as escape_html, c as attr, d as attr_class, f as stringify, g as slot, u as unsubscribe_stores } from "../../chunks/renderer.js";
import { p as page } from "../../chunks/stores.js";
import { m as modules, f as flows } from "../../chunks/flows.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let moduleFilteredFlows, currentFlowId, isTablesPage;
    let moduleFilter = "All";
    moduleFilteredFlows = flows;
    currentFlowId = store_get($$store_subs ??= {}, "$page", page).params.flowId;
    isTablesPage = store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/tables");
    $$renderer2.push(`<div class="page"><aside class="nav"><a href="/" class="brand" aria-label="Home"><div class="dot"></div> <div><div class="eyebrow">D365FO helper</div> <h1>Process Navigator</h1></div></a> <label>Module `);
    $$renderer2.select({ value: moduleFilter }, ($$renderer3) => {
      $$renderer3.push(`<!--[-->`);
      const each_array = ensure_array_like(modules);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let m = each_array[$$index];
        $$renderer3.option({ value: m }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(m)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</label> <div class="nav-label">Flows</div> <div class="flow-list"><!--[-->`);
    const each_array_1 = ensure_array_like(moduleFilteredFlows);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let flow = each_array_1[$$index_1];
      $$renderer2.push(`<a${attr("href", `/flow/${stringify(flow.id)}/${stringify(flow.stages[0].id)}`)}${attr("aria-label", `Open ${stringify(flow.title)}`)}${attr_class("", void 0, { "selected": flow.id === currentFlowId })}><span>${escape_html(flow.title)}</span> <small>${escape_html(flow.summary)}</small></a>`);
    }
    $$renderer2.push(`<!--]--></div> <a href="/tables"${attr_class("nav-link", void 0, { "selected": isTablesPage })}><span class="nav-link-icon">⬡</span> Table Reference</a></aside> <main class="content"><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></main></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
