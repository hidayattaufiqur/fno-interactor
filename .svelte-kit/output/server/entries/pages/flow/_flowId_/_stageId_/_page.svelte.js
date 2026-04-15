import { a6 as head, b as escape_html, e as ensure_array_like, d as attr_class, c as attr, f as stringify, a7 as bind_props } from "../../../../../chunks/renderer.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let flow, stage, flowPersonas, filteredStages, relationEdges;
    let data = $$props["data"];
    let persona = "All";
    let showApprovals = false;
    let viewMode = "process";
    flow = data.flow;
    stage = data.stage;
    if (flow) persona = "All";
    flowPersonas = ["All", ...new Set(flow.stages.flatMap((s) => s.persona))];
    filteredStages = persona === "All" ? flow.stages : flow.stages.filter((s) => s.persona.includes(persona));
    relationEdges = flow.stages.flatMap((s) => s.relations ?? []);
    Array.from(new Set(relationEdges.flatMap((e) => [e.from, e.to])));
    head("mfm1n9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(flow.title)} — ${escape_html(stage.title)} · D365FO Navigator</title>`);
      });
    });
    $$renderer2.push(`<header class="hero"><div><p class="eyebrow">Dynamics 365 Finance &amp; Operations · ${escape_html(flow.module)}</p> <h2>${escape_html(flow.title)}</h2> <p class="lede">${escape_html(flow.summary)}</p></div> <div class="controls"><label>Persona `);
    $$renderer2.select({ value: persona }, ($$renderer3) => {
      $$renderer3.push(`<!--[-->`);
      const each_array = ensure_array_like(flowPersonas);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let p = each_array[$$index];
        $$renderer3.option({ value: p }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(p)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</label> <div class="view-toggle" role="group" aria-label="View mode"><button${attr_class("", void 0, { "view-selected": viewMode === "process" })}>Process</button> <button${attr_class("", void 0, { "view-selected": viewMode === "tables" })}>Tables / relations</button></div> <label class="toggle"><input type="checkbox"${attr("checked", showApprovals, true)}/> <span>Show approvals</span></label></div></header> <section class="flow-map">`);
    {
      $$renderer2.push("<!--[-->");
      if (filteredStages.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="empty">No stages match this persona yet.</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="nodes"><!--[-->`);
        const each_array_1 = ensure_array_like(filteredStages);
        for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
          let s = each_array_1[i];
          $$renderer2.push(`<div class="node-wrapper"><a${attr("href", `/flow/${stringify(flow.id)}/${stringify(s.id)}`)}${attr_class("node", void 0, { "active": stage.id === s.id })}${attr("aria-current", stage.id === s.id ? "page" : void 0)}><div class="node-title">${escape_html(s.title)}</div> <div class="node-meta"><span class="pill">${escape_html(s.persona.join(", "))}</span> `);
          if (s.prerequisites.length) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="mini">${escape_html(s.prerequisites.join(" • "))}</span>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div></a> `);
          if (i < filteredStages.length - 1) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="connector"></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></section> <section class="stage-detail"><div class="stage-head"><div><p class="eyebrow">Stage</p> <h3>${escape_html(stage.title)}</h3> <p class="lede">${escape_html(stage.description)}</p></div> <div class="chips"><!--[-->`);
    const each_array_4 = ensure_array_like(stage.persona);
    for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
      let p = each_array_4[$$index_4];
      $$renderer2.push(`<span class="chip">${escape_html(p)}</span>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="grid"><div class="card"><div class="card-label">Navigate to</div> <ul><!--[-->`);
    const each_array_5 = ensure_array_like(stage.pages);
    for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
      let pg = each_array_5[$$index_5];
      $$renderer2.push(`<li>${escape_html(pg)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul></div> <div class="card"><div class="card-label">Prerequisites</div> `);
    if (stage.prerequisites.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<ul><!--[-->`);
      const each_array_6 = ensure_array_like(stage.prerequisites);
      for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
        let pre = each_array_6[$$index_6];
        $$renderer2.push(`<li>${escape_html(pre)}</li>`);
      }
      $$renderer2.push(`<!--]--></ul>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="mini">None</p>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="card"><div class="card-label">Tables / entities</div> <ul><!--[-->`);
    const each_array_7 = ensure_array_like(stage.tables);
    for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
      let tbl = each_array_7[$$index_7];
      $$renderer2.push(`<li><a${attr("href", `/tables/${stringify(tbl)}`)}>${escape_html(tbl)}</a></li>`);
    }
    $$renderer2.push(`<!--]--></ul></div> <div class="card"><div class="card-label">Common pitfalls</div> `);
    if (stage.pitfalls.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<ul><!--[-->`);
      const each_array_8 = ensure_array_like(stage.pitfalls);
      for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
        let pit = each_array_8[$$index_8];
        $$renderer2.push(`<li>${escape_html(pit)}</li>`);
      }
      $$renderer2.push(`<!--]--></ul>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="mini">None documented yet.</p>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="card"><div class="card-label">Docs</div> <ul><!--[-->`);
    const each_array_9 = ensure_array_like(stage.docs);
    for (let $$index_9 = 0, $$length = each_array_9.length; $$index_9 < $$length; $$index_9++) {
      let doc = each_array_9[$$index_9];
      $$renderer2.push(`<li><a${attr("href", doc.url)} target="_blank" rel="noreferrer">${escape_html(doc.title)}</a></li>`);
    }
    $$renderer2.push(`<!--]--></ul></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (stage.relations?.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="card card-wide"><div class="card-label">Table relations at this stage</div> <div class="inline-relations"><!--[-->`);
      const each_array_11 = ensure_array_like(stage.relations);
      for (let $$index_11 = 0, $$length = each_array_11.length; $$index_11 < $$length; $$index_11++) {
        let rel = each_array_11[$$index_11];
        $$renderer2.push(`<div class="inline-rel"><a${attr("href", `/tables/${stringify(rel.from)}`)} class="rel-from">${escape_html(rel.from)}</a> <span class="rel-arrow">→</span> <a${attr("href", `/tables/${stringify(rel.to)}`)} class="rel-to">${escape_html(rel.to)}</a> `);
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
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
