import type { FC } from "hono/jsx";
import { renderMarkdown } from "@services/markdown/markdown.ts";

/**
 * Único ponto de injeção de HTML rico. `markdownHtml` sanitiza a saída; views comuns
 * continuam proibidas de chamar `dangerouslySetInnerHTML` pelo gate de arquitetura.
 */
export const Markdown: FC<{ source: string }> = ({ source }) => (
  <div class="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />
);
