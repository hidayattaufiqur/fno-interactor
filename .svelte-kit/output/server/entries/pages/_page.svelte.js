import { a6 as head, e as ensure_array_like, b as escape_html, c as attr, f as stringify } from "../../chunks/renderer.js";
import { m as modules, f as flows } from "../../chunks/flows.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let grouped;
    grouped = modules.filter((m) => m !== "All").map((m) => ({ module: m, flows: flows.filter((f) => f.module === m) })).filter((g) => g.flows.length > 0);
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>D365FO Process Navigator</title>`);
      });
    });
    $$renderer2.push(`<header class="home-hero"><p class="eyebrow">Dynamics 365 Finance &amp; Operations</p> <h2>Process Navigator</h2> <p class="lede">Understand business processes, trace table relations, and navigate technical customisations —
    without diving into the AOT blind.</p> <a href="/tables" class="cta-button">⬡ Table Reference →</a></header> <div class="module-grid"><!--[-->`);
    const each_array = ensure_array_like(grouped);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let group = each_array[$$index_1];
      $$renderer2.push(`<div class="module-card"><div class="module-card-header"><span class="pill">${escape_html(group.module)}</span></div> <!--[-->`);
      const each_array_1 = ensure_array_like(group.flows);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let flow = each_array_1[$$index];
        $$renderer2.push(`<a${attr("href", `/flow/${stringify(flow.id)}/${stringify(flow.stages[0].id)}`)} class="flow-link"><div class="flow-link-title">${escape_html(flow.title)}</div> <div class="flow-link-summary">${escape_html(flow.summary)}</div></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
