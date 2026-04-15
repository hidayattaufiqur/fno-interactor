import { a6 as head, b as escape_html, c as attr, e as ensure_array_like, f as stringify, d as attr_class, a7 as bind_props } from "../../../../chunks/renderer.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    head("zsj3ek", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.name)} · Table Reference · D365FO Navigator</title>`);
      });
    });
    $$renderer2.push(`<div class="breadcrumb"><a href="/tables">Table Reference</a> <span>/</span> <span>${escape_html(data.name)}</span></div> <header class="table-def-header"><p class="eyebrow">${escape_html(data.def?.module ?? "D365FO")} Table</p> <h2 class="table-def-name">${escape_html(data.name)}</h2> `);
    if (data.def?.description) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="lede">${escape_html(data.def.description)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.def?.docsUrl) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<a${attr("href", data.def.docsUrl)} target="_blank" rel="noreferrer" class="docs-link">Microsoft Learn docs →</a>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></header> `);
    if (data.def?.fields?.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="detail-section"><div class="section-heading">Key fields</div> <div class="field-table-wrap"><table class="field-table"><thead><tr><th>Field</th><th>Type</th><th>FK / Reference</th><th>Description</th></tr></thead><tbody><!--[-->`);
      const each_array = ensure_array_like(data.def.fields);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let field = each_array[$$index];
        $$renderer2.push(`<tr><td class="field-name">${escape_html(field.name)}</td><td class="field-type">${escape_html(field.type)}</td><td class="field-fk">`);
        if (field.fkTarget) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<a${attr("href", `/tables/${stringify(field.fkTarget)}`)}>${escape_html(field.fkTarget)}</a>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="mini">—</span>`);
        }
        $$renderer2.push(`<!--]--></td><td>${escape_html(field.note)}</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="card no-def-notice"><div class="card-label">Field definitions</div> <p class="mini">No detailed field definitions yet for <strong>${escape_html(data.name)}</strong>. They'll be added as flows are enriched.</p></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.relationsUsing.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="detail-section"><div class="section-heading">Relations involving this table</div> <div class="inline-relations"><!--[-->`);
      const each_array_1 = ensure_array_like(data.relationsUsing);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let rel = each_array_1[$$index_1];
        $$renderer2.push(`<div class="inline-rel"><a${attr("href", `/tables/${stringify(rel.from)}`)}${attr_class("rel-from", void 0, { "self": rel.from === data.name })}>${escape_html(rel.from)}</a> <span class="rel-arrow">→</span> <a${attr("href", `/tables/${stringify(rel.to)}`)}${attr_class("rel-to", void 0, { "self": rel.to === data.name })}>${escape_html(rel.to)}</a> `);
        if (rel.fields?.length) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<code class="rel-fields">${escape_html(rel.fields.join(", "))}</code>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (rel.note) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="mini">${escape_html(rel.note)}</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <a${attr("href", `/flow/${stringify(rel.flowId)}/${stringify(rel.stageId)}`)} class="pill rel-source">${escape_html(rel.stageTitle)}</a></div>`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.usedIn.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="detail-section"><div class="section-heading">Used in ${escape_html(data.usedIn.length)} stage${escape_html(data.usedIn.length !== 1 ? "s" : "")}</div> <div class="table-usages"><!--[-->`);
      const each_array_2 = ensure_array_like(data.usedIn);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let usage = each_array_2[$$index_2];
        $$renderer2.push(`<a${attr("href", `/flow/${stringify(usage.flowId)}/${stringify(usage.stageId)}`)} class="table-usage"><span class="pill">${escape_html(usage.flowTitle)}</span> <span>${escape_html(usage.stageTitle)}</span></a>`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
