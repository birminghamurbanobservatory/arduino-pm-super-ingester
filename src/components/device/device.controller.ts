import {Calibration} from './calibration.interface';
import {DeviceApp} from './device-app.interface';
import * as deviceService from './device.service';


export async function updateDevice(id: string, updates: {pm1?: Calibration; pm2p5?: Calibration; pm10?: Calibration}): Promise<DeviceApp> {

  const updatedDevice = await deviceService.upsertDevice(id, updates);
  return updatedDevice;

}



export async function getDevices(): Promise<DeviceApp[]> {
  const devices = await deviceService.getDevices();
  return devices;
}

