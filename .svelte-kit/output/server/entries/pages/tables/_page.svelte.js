import { a6 as head, c as attr, b as escape_html, e as ensure_array_like, f as stringify, a7 as bind_props } from "../../../chunks/renderer.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tableNames, results, browseable;
    let data = $$props["data"];
    let query = "";
    tableNames = Object.keys(data.tableIndex).sort();
    results = query.trim().length < 2 ? [] : tableNames.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
    browseable = query.trim().length < 2 ? tableNames : [];
    head("bf0doe", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Table Reference · D365FO Navigator</title>`);
      });
    });
    $$renderer2.push(`<header class="hero"><div><p class="eyebrow">Dynamics 365 Finance &amp; Operations</p> <h2>Table Reference</h2> <p class="lede">Look up any D365FO table to see which business processes reference it, what fields link tables
      together, and where to find documentation.</p></div> <div class="controls"><div class="search search-standalone"><label for="table-search">Search table / entity name</label> <input id="table-search" type="text" placeholder="e.g. SalesTable, CustTrans, InventTrans"${attr("value", query)}/></div></div></header> <section class="tables-section">`);
    if (results.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="section-heading">${escape_html(results.length)} result${escape_html(results.length !== 1 ? "s" : "")}</div> <div class="table-results"><!--[-->`);
      const each_array = ensure_array_like(results);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let name = each_array[$$index_1];
        const usages = data.tableIndex[name];
        const def = data.tableDefs[name];
        $$renderer2.push(`<div class="table-result-group"><div class="table-result-header"><a${attr("href", `/tables/${stringify(name)}`)} class="table-name">${escape_html(name)}</a> `);
        if (def) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="pill">${escape_html(def.module)}</span> <span class="mini">${escape_html(def.description)}</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="table-usages"><!--[-->`);
        const each_array_1 = ensure_array_like(usages);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let usage = each_array_1[$$index];
          $$renderer2.push(`<a${attr("href", `/flow/${stringify(usage.flowId)}/${stringify(usage.stageId)}`)} class="table-usage"><span class="pill">${escape_html(usage.flowTitle)}</span> <span>${escape_html(usage.stageTitle)}</span></a>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      if (query.trim().length >= 2) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="empty">No tables match "${escape_html(query.trim())}".</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="section-heading">All tables (${escape_html(tableNames.length)})</div> <div class="table-browse-grid"><!--[-->`);
        const each_array_2 = ensure_array_like(browseable);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let name = each_array_2[$$index_2];
          const def = data.tableDefs[name];
          $$renderer2.push(`<a${attr("href", `/tables/${stringify(name)}`)} class="table-browse-item"><span class="table-name-sm">${escape_html(name)}</span> `);
          if (def) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="mini">${escape_html(def.description)}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<span class="mini usage-count">${escape_html(data.tableIndex[name].length)} stage${escape_html(data.tableIndex[name].length !== 1 ? "s" : "")}</span>`);
          }
          $$renderer2.push(`<!--]--></a>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
