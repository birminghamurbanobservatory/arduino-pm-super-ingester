import {Calibration} from './calibration.interface';

export interface DeviceApp {
  id?: string;
  lastMessageAt?: Date;
  pm1: Calibration;
  pm2p5: Calibration;
  pm10: Calibration;
}