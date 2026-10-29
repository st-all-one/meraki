import { connectionCount, publish, subscribe, unsubscribe } from "./sse.ts";

export default {
  name: "realtime",
  create() {
    return { subscribe, unsubscribe, publish, connectionCount };
  },
};
