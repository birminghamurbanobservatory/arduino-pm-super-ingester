import {round, cloneDeep} from 'lodash';
import * as joi from '@hapi/joi';
import {RawMessage} from './raw-message';
import {DecodedMessage, MessageData} from './decoded-message';
import * as check from 'check-types';
import {Calibration} from '../device/calibration.interface';
import {DeviceApp} from '../device/device-app.interface';


export function decodeArduinoPmHexString(hexString: string): MessageData {

  const data = {
    temp: round(int16ToFloat(converter16bit(hexString.slice(0, 4)), 60, -60), 2),
    humid: round(uint16ToFloat(converter16bit(hexString.slice(4, 8)), 110), 2),
    pm1:round(int16ToFloat(converter16bit(hexString.slice(8, 12)), 100, 1), 2),
    pm2p5:round(int16ToFloat(converter16bit(hexString.slice(12, 16)), 100, 1), 2),
    pm10:round(int16ToFloat(converter16bit(hexString.slice(16, 20)), 100, 1), 2),
  };

  return data;
}


function converter16bit(hexChunk: string): number {
  if (hexChunk.length !== 4) throw new Error('Wrong length');
  const ordered = hexChunk.slice(2, 4) + hexChunk.slice(0, 2);
  const asInt = parseInt(ordered, 16);
  return asInt;
}

function int16ToFloat(value: number, max: number, min: number): number {
  const conversionFactor = 32768 / (max - min);
  const asFloat = value / conversionFactor;
  return asFloat; 
}

function uint16ToFloat(value: number, max: number): number {
  const conversionFactor = 65536 / max;
  const asFloat = value / conversionFactor;
  return asFloat;
}


export function applyCalibration(uncorrectedValue: number, humidityValue: number, calibration: Calibration): number {
  let correctedValue;
  if (humidityValue < 85) {
    correctedValue = (uncorrectedValue - calibration.lt85.c) / calibration.lt85.m;
  } else {
    correctedValue = (uncorrectedValue - calibration.gte85.c) / calibration.gte85.m;
  }
  
  return correctedValue;
}


const messageSchema = joi.object({
  device: joi.string().required(),
  data: joi.string().required(),
  time: joi.number().required(),
  rssi: joi.number().allow(null), // need to allow null for contracts that haven't paid for it 
});

export function validateMessage(message: RawMessage): void {

  const {error: err} = messageSchema.validate(message);

  if (err) {
    throw new Error(`Invalid message: ${err.message}`);
  }

  return;
}


export function decodeMessage(message: RawMessage): DecodedMessage {

  const decoded: any = {
    device: message.device.toLowerCase(),
    data: decodeArduinoPmHexString(message.data),
    time: new Date(message.time * 1000)
  };

  if (check.number(message.rssi)) {
    decoded.rssi = message.rssi;
  }

  return decoded;

}


export function decodedMessageToObservations(decodedMessage: DecodedMessage, deviceOnRecord?: DeviceApp): any[] {

  let pm1Calibration;
  let pm2p5Calibration;
  let pm10Calibration;

  if (deviceOnRecord) {
    if (deviceOnRecord.pm1) pm1Calibration = deviceOnRecord.pm1;
    if (deviceOnRecord.pm2p5) pm2p5Calibration = deviceOnRecord.pm2p5;
    if (deviceOnRecord.pm10) pm10Calibration = deviceOnRecord.pm10;    
  }

  const uncorrectedFlag = 'raw';
  const calibrationProcedure = 'arduino-pm-calibration-correction-v2';

  const observations = [];
  
  const resultTime = decodedMessage.time.toISOString();

  const prefix = 'arduino-pm';
  const sensorIdLowercase = decodedMessage.device.toLowerCase();

  // Temp
  if (check.assigned(decodedMessage.data.temp)) {
    const tempObs = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-sht85`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.temp,
        unit: 'degree-celsius'
      },
      observedProperty: 'air-temperature',
      aggregation: 'instant'
    };
    observations.push(tempObs);
  }

  // Humidity
  const humidityValueExists = check.assigned(decodedMessage.data.humid);
  if (humidityValueExists) {
    const humidObs = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-sht85`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.humid,
        unit: 'percent'
      },
      observedProperty: 'relative-humidity',
      aggregation: 'instant'
    };
    observations.push(humidObs);
  }

  // PM1
  if (check.assigned(decodedMessage.data.pm1)) {

    const pm1Obs: any = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-pms5003`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.pm1,
        unit: 'microgram-per-cubic-metre'
      },
      observedProperty: 'pm1-mass-concentration',
      aggregation: 'instant'
    };

    if (pm1Calibration && humidityValueExists) {

      // Create a corrected observation too
      const pm1ObsCorrected = cloneDeep(pm1Obs);
      pm1ObsCorrected.hasResult.value = round(applyCalibration(decodedMessage.data.pm1, decodedMessage.data.humid, pm1Calibration), 2);
      pm1ObsCorrected.usedProcedures = [calibrationProcedure];
      observations.push(pm1ObsCorrected);

      // Flag the uncorrected observation. N.B. if there's no calibration on record then no flag will be added.
      pm1Obs.hasResult.flags = [uncorrectedFlag];

    }

    observations.push(pm1Obs);
  }

  // PM2.5
  if (check.assigned(decodedMessage.data.pm2p5)) {

    const pm2p5Obs: any = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-pms5003`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.pm2p5,
        unit: 'microgram-per-cubic-metre'
      },
      observedProperty: 'pm2p5-mass-concentration',
      aggregation: 'instant'
    };

    if (pm2p5Calibration && humidityValueExists) {

      // Create a corrected observation too
      const p2p5ObsCorrected = cloneDeep(pm2p5Obs);
      p2p5ObsCorrected.hasResult.value = round(applyCalibration(decodedMessage.data.pm2p5, decodedMessage.data.humid, pm2p5Calibration), 2);
      p2p5ObsCorrected.usedProcedures = [calibrationProcedure];
      observations.push(p2p5ObsCorrected);

      // Flag the uncorrected observation. N.B. if there's no calibration on record then no flag will be added.
      pm2p5Obs.hasResult.flags = [uncorrectedFlag];

    }

    observations.push(pm2p5Obs);

  }

  // PM10
  if (check.assigned(decodedMessage.data.pm10)) {

    const pm10Obs: any = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-pms5003`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.pm10,
        unit: 'microgram-per-cubic-metre'
      },
      observedProperty: 'pm10-mass-concentration',
      aggregation: 'instant'
    };

    if (pm10Calibration && humidityValueExists) {

      // Create a corrected observation too
      const p10ObsCorrected = cloneDeep(pm10Obs);
      p10ObsCorrected.hasResult.value = round(applyCalibration(decodedMessage.data.pm10, decodedMessage.data.humid, pm10Calibration), 2);
      p10ObsCorrected.usedProcedures = [calibrationProcedure];
      observations.push(p10ObsCorrected);

      // Flag the uncorrected observation. N.B. if there's no calibration on record then no flag will be added.
      pm10Obs.hasResult.flags = [uncorrectedFlag];

    }

    observations.push(pm10Obs);
  }

  // RSSI
  if (decodedMessage.rssi) {
    const tempObs = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-basestation`,
      resultTime,
      hasResult: {
        value: decodedMessage.rssi,
        unit: 'decibel'
      },
      observedProperty: 'received-signal-strength-indicator',
      aggregation: 'instant'
    };
    observations.push(tempObs);
  }

  return observations;

}