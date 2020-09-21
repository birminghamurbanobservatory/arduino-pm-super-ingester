export interface DecodedMessage {
  device: string;
  data: MessageData;
  time: Date;
  rssi: number; // might not be present given the updates to the sigfox backend.
}

export interface MessageData {
  temp: number;
  humid: number;
  pm1: number;
  pm2p5: number;
  pm10: number;
}