export interface RawMessage {
  device: string;
  data: string;
  time: number;
  rssi?: number; // could be null given recent updates to sigfox backend
}