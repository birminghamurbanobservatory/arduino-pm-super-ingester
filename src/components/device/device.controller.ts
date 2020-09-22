import {Calibration} from './calibration.interface';
import {DeviceApp} from './device-app.interface';
import * as deviceService from './device.service';
import * as logger from 'node-logger';


export async function updateDevice(id: string, updates: {pm1?: Calibration; pm2p5?: Calibration; pm10?: Calibration}): Promise<DeviceApp> {

  const updatedDevice = await deviceService.upsertDevice(id, updates);
  return updatedDevice;

}


export async function getDevices(): Promise<DeviceApp[]> {
  logger.debug('Getting list of devices');
  const devices = await deviceService.getDevices();
  return devices;
}


export async function getDevice(id: string): Promise<DeviceApp> {
  const device = await deviceService.getDevice(id);
  return device;
}

