export interface SseClient {
  write(event: string, data: string, id?: string): Promise<void>;
  close(): void;
}

interface Room {
  clients: Set<SseClient>;
}

const rooms = new Map<string, Room>();
const clientChannels = new WeakMap<SseClient, Set<string>>();

export function subscribe(channelId: string, client: SseClient): void {
  let room = rooms.get(channelId);
  if (!room) {
    room = { clients: new Set() };
    rooms.set(channelId, room);
  }
  room.clients.add(client);
  let channels = clientChannels.get(client);
  if (!channels) {
    channels = new Set();
    clientChannels.set(client, channels);
  }
  channels.add(channelId);
}

export function unsubscribe(channelId: string, client: SseClient): void {
  const room = rooms.get(channelId);
  room?.clients.delete(client);
  if (room && room.clients.size === 0) rooms.delete(channelId);
  clientChannels.get(client)?.delete(channelId);
}

export function publish(channelId: string, event: string, payload: unknown, id?: string): void {
  const room = rooms.get(channelId);
  if (!room) return;
  const data = JSON.stringify(payload);
  for (const client of [...room.clients]) {
    void client.write(event, data, id).catch(() => {
      unsubscribe(channelId, client);
      client.close();
    });
  }
}

export function connectionCount(channelId: string): number {
  return rooms.get(channelId)?.clients.size ?? 0;
}
