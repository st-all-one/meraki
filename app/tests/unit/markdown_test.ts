import { assertEquals, assertStringIncludes } from "@std/assert";
import { renderMarkdown } from "../../src/services/markdown/markdown.ts";

Deno.test("markdown: básicos e tabela", () => {
  const html = renderMarkdown("**forte** e `código`\n\n| A | B |\n|---|---|\n| 1 | 2 |");
  assertStringIncludes(html, "<strong>forte</strong>");
  assertStringIncludes(html, "<code>código</code>");
  assertStringIncludes(html, "<table>");
});

Deno.test("markdown: HTML cru vira texto", () => {
  const html = renderMarkdown("<script>alert(1)</script>");
  assertStringIncludes(html, "&lt;script&gt;");
  assertEquals(html.includes("<script>"), false);
});

Deno.test("markdown: javascript e imagem não executam", () => {
  const html = renderMarkdown("[x](javascript:alert(1))\n\n![a](https://evil/x.png)");
  assertStringIncludes(html, "md-rejected");
  assertEquals(html.includes('href="javascript'), false);
  assertEquals(html.includes("<a "), false);
});
