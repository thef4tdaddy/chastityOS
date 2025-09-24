
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("ConnectionStatus");

class ConnectionStatus {
  private isOnline = navigator.onLine;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    window.addEventListener("online", () => this.setStatus(true));
    window.addEventListener("offline", () => this.setStatus(false));
  }

  private setStatus(isOnline: boolean) {
    if (this.isOnline === isOnline) return;

    this.isOnline = isOnline;
    logger.info(`Connection status changed: ${isOnline ? "Online" : "Offline"}`);
    this.listeners.forEach(listener => listener(isOnline));
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    // Immediately notify the new listener
    listener(this.isOnline);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const connectionStatus = new ConnectionStatus();
