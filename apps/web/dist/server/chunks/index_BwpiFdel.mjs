globalThis.process ??= {};
globalThis.process.env ??= {};
import { c as createComponent } from "./astro-component_Btr8GKhZ.mjs";
import { h as addAttribute, l as renderHead, n as renderSlot, r as renderTemplate, o as renderComponent, m as maybeRenderHead } from "./worker-entry_Bl94pRzx.mjs";
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title = "Rebase Community",
    description = "A community media website for articles, GeekDaily, hiring, events, and contributors."
  } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><meta name="description"${addAttribute(description, "content")}>${renderHead()}</head> <body> <main> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "/Users/ruix/Development/OpenSource/Rebase/rebase.network/apps/web/src/layouts/BaseLayout.astro", void 0);
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="shell hero card" data-astro-cid-j7pv25f6> <p class="eyebrow" data-astro-cid-j7pv25f6>rebase community</p> <h1 data-astro-cid-j7pv25f6>Rebase is being rebuilt as a living community media website.</h1> <p data-astro-cid-j7pv25f6>
The v1 foundation is now in progress with Astro, Cloudflare Workers, Directus,
      PostgreSQL, and R2.
</p> </section> ` })}`;
}, "/Users/ruix/Development/OpenSource/Rebase/rebase.network/apps/web/src/pages/index.astro", void 0);
const $$file = "/Users/ruix/Development/OpenSource/Rebase/rebase.network/apps/web/src/pages/index.astro";
const $$url = "";
const _page = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: "Module" }));
const page = () => _page;
export {
  page
};
