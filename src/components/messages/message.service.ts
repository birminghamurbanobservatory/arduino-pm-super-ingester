import {round} from 'lodash';
import * as joi from '@hapi/joi';
import {RawMessage} from './raw-message';
import {DecodedMessage, MessageData} from './decoded-message';
import * as check from 'check-types';


export function decodeArduinoPmHexString(hexString: string): MessageData {

  const data = {
    temp: round(int16ToFloat(converter16bit(hexString.slice(0, 4)), 60, -60), 2),
    humid: round(uint16ToFloat(converter16bit(hexString.slice(4, 8)), 110), 2),
    pm1:round(int16ToFloat(converter16bit(hexString.slice(8, 12)), 100, 1), 2),
    pm25:round(int16ToFloat(converter16bit(hexString.slice(12, 16)), 100, 1), 2),
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
    device: message.device,
    data: decodeArduinoPmHexString(message.data),
    time: new Date(message.time * 1000)
  };

  if (check.number(message.rssi)) {
    decoded.rssi = message.rssi;
  }

  return decoded;

}


export function decodedMessageToObservations(decodedMessage: DecodedMessage): any[] {

  const observations = [];
  
  const resultTime = decodedMessage.time.toISOString();

  const prefix = 'arduino-pm';
  const sensorIdLowercase = decodedMessage.device.toLowerCase();

  // Temp
  if (decodedMessage.data.temp) {
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
  if (decodedMessage.data.humid) {
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
  if (decodedMessage.data.humid) {
    const pm1Obs = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-pms5003`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.pm1,
        unit: 'microgram-per-cubic-metre'
      },
      observedProperty: 'pm1-mass-concentration',
      aggregation: 'instant'
    };
    observations.push(pm1Obs);
  }

  // PM2.5
  if (decodedMessage.data.humid) {
    const pm25Obs = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-pms5003`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.pm25,
        unit: 'microgram-per-cubic-metre'
      },
      observedProperty: 'pm2p5-mass-concentration',
      aggregation: 'instant'
    };
    observations.push(pm25Obs);
  }

  // PM10
  if (decodedMessage.data.humid) {
    const pm10Obs = {
      madeBySensor: `${prefix}-${sensorIdLowercase}-pms5003`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.pm10,
        unit: 'microgram-per-cubic-metre'
      },
      observedProperty: 'pm10-mass-concentration',
      aggregation: 'instant'
    };
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