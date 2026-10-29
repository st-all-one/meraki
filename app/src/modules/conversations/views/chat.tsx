import type { FC } from "hono/jsx";
import type { Actor } from "@services/auth/contract.ts";
import { Page } from "@layout/views/page.tsx";
import { Composer, MessageList, type MessageView } from "@layout/views/chat.tsx";

interface ChannelListRow {
  id: string;
  name: string;
  scope: string;
  unread: number;
}

export const ChatHomePage: FC<{
  actor: Actor;
  unread: number;
  channels: ChannelListRow[];
}> = ({ actor, unread, channels }) => (
  <Page actor={actor} title="Chat" active="chat" unread={unread}>
    <div class="page-head">
      <div>
        <h1>Chat</h1>
        <p class="lede">Geral e canais de pasta. Conversas de demanda ficam na demanda.</p>
      </div>
    </div>
    <div class="grid-cards">
      {channels.map((channel) => (
        <a class="card card-pad" href={`/chat/channels/${channel.id}`}>
          <div class="section-head">
            <h2>#{channel.name}</h2>
            {channel.unread > 0 ? <span class="badge badge-danger">{channel.unread}</span> : null}
          </div>
          <span class="muted small">{channel.scope === "general" ? "Todo o time" : "Pasta"}</span>
        </a>
      ))}
    </div>
  </Page>
);

export const ChannelPage: FC<{
  actor: Actor;
  unread: number;
  channel: { id: string; name: string; scope: string };
  channels: ChannelListRow[];
  messages: MessageView[];
  canEditAny: boolean;
  maxLength: number;
  older?: string;
}> = ({ actor, unread, channel, channels, messages, canEditAny, maxLength, older }) => (
  <Page actor={actor} title={`#${channel.name}`} active="chat" unread={unread}>
    <div class="page-head">
      <div>
        <h1>#{channel.name}</h1>
        <p class="lede">{channel.scope === "general" ? "Canal geral do time" : "Canal da pasta"}</p>
      </div>
      <a class="btn btn-small" href="/chat">Todos os canais</a>
    </div>
    <div class="item-grid">
      <div>
        {older
          ? (
            <p>
              <a href={`?before=${older}`}>Carregar anteriores</a>
            </p>
          )
          : null}
        <div id="chat-stream" data-channel-id={channel.id}>
          <MessageList
            messages={messages}
            actor={actor}
            canEditAny={canEditAny}
            empty="Nenhuma mensagem ainda."
          />
        </div>
        <div class="section">
          <Composer action={`/chat/channels/${channel.id}/messages`} maxLength={maxLength} />
        </div>
      </div>
      <aside class="card card-pad" aria-label="Canais">
        <h2 class="h2-small">Canais</h2>
        <ul class="history">
          {channels.map((item) => (
            <li>
              <a
                href={`/chat/channels/${item.id}`}
                aria-current={item.id === channel.id ? "page" : undefined}
              >
                #{item.name}
              </a>{" "}
              {item.unread > 0 ? <span class="badge badge-danger">{item.unread}</span> : null}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  </Page>
);
