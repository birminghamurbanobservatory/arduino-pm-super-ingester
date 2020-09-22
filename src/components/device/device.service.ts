import {DeviceApp} from './device-app.interface';
import Device from './device.model';
import {GetDeviceFail} from './errors/GetDeviceFail';
import {GetDevicesFail} from './errors/GetDevicesFail';
import {UpsertDeviceFail} from './errors/UpsertDeviceFail';
import {DeviceNotFound} from './errors/DeviceNotFound';
import {Calibration} from './calibration.interface';
import {cloneDeep} from 'lodash';
import * as check from 'check-types';


export async function getDevice(id: string): Promise<DeviceApp> {

  let device;

  try {
    device = await Device.findById(id).exec();
  } catch (err) {
    throw new GetDeviceFail(undefined, err.message);
  }

  if (!device) {
    throw new DeviceNotFound();
  }

  const formatted = deviceDbToApp(device);

  return formatted;

}


export async function upsertDevice(id: string, updates: {lastMessageAt?: Date; pm1?: Calibration; pm2p5?: Calibration; pm10?: Calibration}): Promise<DeviceApp> {

  let device;

  // Change null values to unset
  const updatesWithUnset: any = cloneDeep(updates);
  updatesWithUnset.$unset = {};
  const keys = ['pm1', 'pm2p5', 'pm10'];
  keys.forEach((key) => {
    if (check.null(updatesWithUnset[key])) {
      updatesWithUnset.$unset[key] = '';
      delete updatesWithUnset[key];
    }
  });

  try {
    device = await Device.findByIdAndUpdate(id, updatesWithUnset, {new: true, upsert: true, setDefaultsOnInsert: true}).exec();
  } catch (err) {
    throw new UpsertDeviceFail(undefined, err.message);
  }

  const formatted = deviceDbToApp(device);

  return formatted;

}



export async function getDevices(): Promise<DeviceApp[]> {

  let devices;
  try {
    devices = await Device.find({}).exec();
  } catch (err) {
    throw new GetDevicesFail(undefined, err.message);
  }

  const formatted = devices.map(deviceDbToApp);

  return formatted;

}



function deviceDbToApp(dbFormat: any): DeviceApp {
  const appFormat = dbFormat.toObject();
  appFormat.id = appFormat._id.toString();
  delete appFormat._id;
  delete appFormat.__v;
  return appFormat;
}