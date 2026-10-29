// @ts-types="npm:@types/markdown-it@14.1.2"
import MarkdownIt from "markdown-it";
import { htmlEscape } from "@kernel/util.ts";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: false,
});

md.validateLink = (url: string): boolean => /^(https?:|mailto:)/i.test(url);

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx];
  const alt = token?.content ?? "";
  const src = token?.attrGet("src") ?? "";
  return `<span class="md-rejected">imagem removida (${htmlEscape(alt || src)})</span>`;
};

const defaultLinkOpen = md.renderer.rules["link_open"];
md.renderer.rules["link_open"] = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token?.attrGet("href") ?? "";
  if (!/^(https?:|mailto:)/i.test(href)) {
    token?.attrSet("href", "#");
    token?.attrSet("data-invalid-link", "1");
  } else {
    token?.attrSet("rel", "nofollow noopener noreferrer");
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}

export function renderInline(source: string): string {
  return md.renderInline(source);
}
