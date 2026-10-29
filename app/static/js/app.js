(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Confirmações declarativas evitam handlers inline bloqueados pela CSP.
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const message = form.dataset.confirm;
    if (message && !confirm(message)) event.preventDefault();
  });

  // Mover no board sem depender de handler inline.
  $$("[data-autosubmit]").forEach((select) => {
    select.addEventListener("change", () => {
      if (select.form) select.form.requestSubmit();
    });
  });

  // Atalhos.
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const typing = target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if (event.key === "/" && !typing) {
      const search = $("#top-search");
      if (search) {
        event.preventDefault();
        search.focus();
      }
    }
    if ((event.key === "c" || event.key === "C") && !typing) {
      event.preventDefault();
      window.location.href = "/items/new?kind=issue";
    }
    if (event.key === "Escape") {
      closeCanvas();
    }
  });

  // Composer Markdown: toolbar, preview e chips de arquivo.
  const debounce = (fn, ms) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  $$("[data-composer]").forEach((form) => {
    const textarea = $("[data-markdown-input]", form);
    const preview = $("[data-preview]", form);
    if (!(textarea instanceof HTMLTextAreaElement) || !(preview instanceof HTMLElement)) return;

    const refresh = debounce(async () => {
      if (!textarea.value.trim()) {
        preview.innerHTML = "";
        return;
      }
      try {
        const response = await fetch("/markdown/preview", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ body_md: textarea.value }),
          credentials: "same-origin",
        });
        preview.innerHTML = response.ok ? await response.text() : '<span class="muted">Prévia indisponível.</span>';
      } catch {
        preview.innerHTML = '<span class="muted">Prévia indisponível.</span>';
      }
    }, 150);
    textarea.addEventListener("input", refresh);

    $$("[data-md]", form).forEach((button) => {
      button.addEventListener("click", () => {
        const kind = button.dataset.md;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.slice(start, end);
        const wraps = {
          bold: ["**", "**"],
          italic: ["_", "_"],
          code: ["`", "`"],
          link: ["[", "](https://)"],
          list: ["\n- ", ""],
          quote: ["\n> ", ""],
          table: ["\n| Coluna | Coluna |\n|---|---|\n| ", " |  |\n"],
        };
        const pair = wraps[kind] || ["", ""];
        const insert = pair[0] + (selected || "") + pair[1];
        textarea.setRangeText(insert, start, end, "end");
        textarea.focus();
        refresh();
      });
    });

    const fileInput = $('input[type="file"]', form);
    const fileList = $("[data-file-list]", form);
    if (fileInput instanceof HTMLInputElement && fileList) {
      fileInput.addEventListener("change", () => {
        const names = [...(fileInput.files || [])].map((file) => file.name);
        fileList.textContent = names.length ? names.join(" · ") : "";
      });
    }

    textarea.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        form.requestSubmit();
      }
    });
  });

  $$("[data-cancel-edit]").forEach((button) => {
    button.addEventListener("click", () => window.location.reload());
  });

  // SSE do chat.
  const stream = $("#chat-stream");
  const channelId = stream?.dataset.channelId;
  if (stream && channelId) {
    const list = $("#message-list", stream);
    const seen = new Set($$("[data-message-id]", stream).map((el) => el.dataset.messageId));
    const source = new EventSource(`/chat/channels/${channelId}/events`);
    let reconnectStatus = null;
    source.addEventListener("open", () => {
      if (reconnectStatus) {
        reconnectStatus.remove();
        reconnectStatus = null;
      }
    });
    source.addEventListener("error", () => {
      if (!reconnectStatus) {
        reconnectStatus = document.createElement("div");
        reconnectStatus.className = "alert";
        reconnectStatus.textContent = "Reconectando…";
        stream.prepend(reconnectStatus);
      }
    });
    const appendMessage = async (id) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      try {
        const response = await fetch(`/messages/${encodeURIComponent(id)}/partial`, {
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const html = await response.text();
        const template = document.createElement("template");
        template.innerHTML = html;
        const node = template.content.firstElementChild;
        if (!node) return;
        if (list) list.append(node);
        else stream.append(node);
        node.scrollIntoView({ block: "end", behavior: "smooth" });
      } catch {
        // Próximo evento ou recarregamento recupera.
      }
    };
    source.addEventListener("message", (event) => {
      try {
        appendMessage(JSON.parse(event.data).id);
      } catch {
        // Evento inválido.
      }
    });
    const replaceMessage = async (id) => {
      if (!id) return;
      const response = await fetch(`/messages/${encodeURIComponent(id)}/partial`, {
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const html = await response.text();
      const current = document.getElementById(`m-${id}`);
      if (!current) return;
      const template = document.createElement("template");
      template.innerHTML = html;
      if (template.content.firstElementChild) current.replaceWith(template.content.firstElementChild);
    };
    source.addEventListener("message.updated", (event) => {
      try { replaceMessage(JSON.parse(event.data).id); } catch { /* ignore */ }
    });
    source.addEventListener("message.archived", (event) => {
      try { replaceMessage(JSON.parse(event.data).id); } catch { /* ignore */ }
    });

    const markRead = async () => {
      const messages = $$("[data-message-id]", stream);
      const last = messages.at(-1)?.dataset.messageId;
      if (!last) return;
      await fetch(`/chat/channels/${channelId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ last_read_message_id: last }),
        credentials: "same-origin",
      }).catch(() => {});
    };
    markRead();
    window.addEventListener("beforeunload", () => source.close());
  }

  // Canvas em modal full-screen, isolado em iframe same-origin.
  let modal = null;
  function closeCanvas() {
    if (!modal) return;
    modal.remove();
    modal = null;
    document.body.style.overflow = "";
  }
  $$("[data-canvas-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = button.dataset.itemId;
      if (!itemId) return;
      modal = document.createElement("div");
      modal.className = "canvas-modal";
      modal.innerHTML = `
        <div class="canvas-head">
          <strong>Canvas · ${document.title.split(" · ")[0]}</strong>
          <span class="presence" id="canvas-presence"></span>
          <span class="spacer"></span>
          <button class="btn btn-small" type="button" id="canvas-close">Fechar</button>
        </div>
        <iframe class="canvas-frame" title="Canvas colaborativo"
          src="/items/${encodeURIComponent(itemId)}/canvas/frame"
          allow="clipboard-read; clipboard-write"></iframe>`;
      document.body.append(modal);
      document.body.style.overflow = "hidden";
      $("#canvas-close", modal).addEventListener("click", closeCanvas);
      modal.querySelector("iframe")?.focus();
    });
  });

  // PWA + Web Push.
  const pushButton = $("[data-push-enable]");
  const pushStatus = $("[data-push-status]");
  const setupPush = async () => {
    if (!pushButton) return;
    pushButton.addEventListener("click", async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          if (pushStatus) pushStatus.textContent = "Este navegador não suporta push.";
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          if (pushStatus) pushStatus.textContent = "Permissão negada no navegador.";
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const key = pushButton.dataset.vapid || "";
        if (!key) {
          if (pushStatus) pushStatus.textContent = "VAPID não configurado no servidor.";
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        const response = await fetch("/account/push/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
          credentials: "same-origin",
        });
        if (pushStatus) {
          pushStatus.textContent = response.ok ? "Push ativado neste dispositivo." : "Falha ao salvar dispositivo.";
        }
      } catch (error) {
        if (pushStatus) pushStatus.textContent = `Falha: ${error.message}`;
      }
    });
  };
  setupPush();

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }
})();
