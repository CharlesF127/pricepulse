import io from "socket.io-client";

export const socket = io("`${API_BASE}", {
  transports: ["websocket"],
});
