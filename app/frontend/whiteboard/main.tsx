import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CaptureUpdateAction, Excalidraw, exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import type { BinaryFiles, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import "./styles.css";

type Scene = {
  elements: readonly ExcalidrawElement[];
  appState?: Record<string, unknown>;
};

type Participant = { id: string; name: string; color: string };

const root = document.getElementById("whiteboard-root");
const itemId = root?.dataset.itemId ?? "";

function App() {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const suppress = useRef(false);
  const lastSent = useRef(0);
  const dirty = useRef(false);
  const persister = useRef(false);
  const sceneRef = useRef<Scene>({ elements: [] });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState("Conectando…");
  const [initial, setInitial] = useState<Scene | null>(null);

  useEffect(() => {
    fetch(`/api/items/${encodeURIComponent(itemId)}/canvas`, { credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("canvas")))
      .then((data: { scene: Scene; participants: Participant[] }) => {
        setInitial(data.scene);
        setParticipants(data.participants);
      })
      .catch(() => setInitial({ elements: [] }));
  }, []);

  useEffect(() => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(
      `${protocol}//${location.host}/items/${encodeURIComponent(itemId)}/canvas/ws`,
    );
    socketRef.current = socket;
    socket.addEventListener("open", () => setStatus("Conectado"));
    socket.addEventListener("close", () => setStatus("Reconectando…"));
    socket.addEventListener("error", () => setStatus("Reconectando…"));
    socket.addEventListener("message", (event) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(String(event.data)) as Record<string, unknown>;
      } catch {
        return;
      }
      const type = message.type;
      if (type === "scene-state") {
        const scene = message.scene as Scene;
        const self = message.self as Participant;
        persister.current = Boolean(message.persister);
        setParticipants((message.participants as Participant[]) ?? []);
        setInitial(scene);
        suppress.current = true;
        apiRef.current?.updateScene({
          elements: scene.elements,
          appState: scene.appState as never,
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        suppress.current = false;
        if (self) setStatus(`Conectado · ${self.name}`);
      } else if (type === "scene-update") {
        suppress.current = true;
        apiRef.current?.updateScene({
          elements: (message.elements as ExcalidrawElement[]) ?? [],
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        suppress.current = false;
      } else if (type === "participant-joined") {
        const participant = message.participant as Participant;
        setParticipants((
          current,
        ) => [...current.filter((p) => p.id !== participant.id), participant]);
      } else if (type === "participant-left") {
        const participant = message.participant as Participant;
        setParticipants((current) => current.filter((p) => p.id !== participant.id));
      } else if (type === "persister") {
        persister.current = Boolean(message.persister);
      } else if (type === "saved") {
        setStatus(`Salvo · versão ${message.version}`);
      }
    });
    const timer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
      if (persister.current && dirty.current && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "snapshot", scene: sceneRef.current }));
        dirty.current = false;
      }
    }, 5000);
    return () => {
      clearInterval(timer);
      if (persister.current && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "snapshot", scene: sceneRef.current }));
      }
      socket.close();
    };
  }, []);

  const onChange = useCallback((
    elements: readonly ExcalidrawElement[],
    appState: Record<string, unknown>,
    _files: BinaryFiles,
  ) => {
    sceneRef.current = { elements, appState };
    dirty.current = true;
    if (suppress.current) return;
    const now = Date.now();
    if (now - lastSent.current < 50) return;
    lastSent.current = now;
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "scene-update",
        elements,
        appState: { viewBackgroundColor: appState.viewBackgroundColor },
      }));
    }
  }, []);

  const exportAs = async (format: "excalidraw" | "png" | "svg") => {
    const api = apiRef.current;
    if (!api) return;
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();
    let blob: Blob;
    let name: string;
    if (format === "excalidraw") {
      blob = new Blob([
        JSON.stringify(
          { type: "excalidraw", version: 2, source: location.origin, elements, appState, files },
          null,
          2,
        ),
      ], { type: "application/json" });
      name = "canvas.excalidraw";
    } else if (format === "png") {
      blob = await exportToBlob({ elements, appState, files, mimeType: "image/png" });
      name = "canvas.png";
    } else {
      const svg = await exportToSvg({ elements, appState, files });
      blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
      name = "canvas.svg";
    }
    const data = new FormData();
    data.append("file", new File([blob], name, { type: blob.type }));
    const response = await fetch(
      `/api/items/${encodeURIComponent(itemId)}/canvas/export?format=${format}`,
      { method: "POST", body: data, credentials: "same-origin" },
    );
    if (response.ok) {
      const result = await response.json() as { url: string };
      globalThis.open(result.url, "_blank", "noopener");
    } else {
      setStatus("Falha ao exportar");
    }
  };

  return (
    <div className="wb-shell">
      <div className="wb-bar">
        <strong>{root?.dataset.code ?? "Canvas"}</strong>
        <span className="wb-presence">
          {participants.map((p) => (
            <span className="wb-person" key={p.id} title={p.name} style={{ color: p.color }}>
              {p.name.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </span>
        <span className="wb-status">{status}</span>
        <span className="wb-spacer" />
        <button type="button" onClick={() => exportAs("excalidraw")}>.excalidraw</button>
        <button type="button" onClick={() => exportAs("png")}>PNG</button>
        <button type="button" onClick={() => exportAs("svg")}>SVG</button>
      </div>
      <div className="wb-canvas">
        {initial
          ? (
            <Excalidraw
              initialData={{ elements: initial.elements, appState: initial.appState as never }}
              excalidrawAPI={(api) => {
                apiRef.current = api;
              }}
              onChange={onChange}
              UIOptions={{ canvasActions: { loadScene: false } }}
            />
          )
          : <p className="wb-loading">Carregando canvas…</p>}
      </div>
    </div>
  );
}

if (root) createRoot(root).render(<App />);
