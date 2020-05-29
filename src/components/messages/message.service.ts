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

  const {error: err} = joi.validate(message, messageSchema);

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

  // Temp
  if (decodedMessage.data.temp) {
    const tempObs = {
      madeBySensor: `${prefix}-${decodedMessage.device}-thermistor`,
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
    const tempObs = {
      madeBySensor: `${prefix}-${decodedMessage.device}-hygrometer`,
      resultTime,
      hasResult: {
        value: decodedMessage.data.temp,
        unit: 'percent'
      },
      observedProperty: 'relative-humidity',
      aggregation: 'instant'
    };
    observations.push(tempObs);
  }

  // TODO: Need to add PM variables to list of observed properties in common vocab first.

  return observations;

}