import {decodeArduinoPmHexString, decodeMessage, decodedMessageToObservations} from './message.service';

describe('Testing of decodeArduinoPmHexString function', () => {

  test('Converts a typical hex string as expected', () => {
    
    const hexString = '9a1d4c5c0c09ed0c830f0000';

    const expected = {
      temp: 27.75,
      humid: 39.66,
      pm1: 7, 
      pm25: 10,
      pm10: 12
    };

    const dataOut = decodeArduinoPmHexString(hexString);
    expect(dataOut).toEqual(expected);

  });

});




describe('Testing of decodeMessage function', () => {

  test('Converts typical Sigfox message (without RSSI) as expected', () => {
    
    const message = {
      device: '123ABC',
      data: '9a1d4c5c0c09ed0c830f0000',
      time: 1535451492  
    };

    const expected = {
      device: '123ABC',
      time: new Date('2018-08-28T10:18:12.000Z'),
      data: {
        temp: 27.75,
        humid: 39.66,
        pm1: 7, 
        pm25: 10,
        pm10: 12
      }
    };

    const decoded = decodeMessage(message);
    expect(decoded).toEqual(expected);

  });


  test('Converts typical Sigfox message (with RSSI) as expected', () => {
    
    const message = {
      device: '123ABC',
      data: '9a1d4c5c0c09ed0c830f0000',
      time: 1535451492,
      rssi: -101  
    };

    const expected = {
      device: '123ABC',
      time: new Date('2018-08-28T10:18:12.000Z'),
      rssi: -101,
      data: {
        temp: 27.75,
        humid: 39.66,
        pm1: 7, 
        pm25: 10,
        pm10: 12
      }
    };

    const decoded = decodeMessage(message);
    expect(decoded).toEqual(expected);

  });

});




describe('Testing of decodedMessageToObservations function', () => {

  test('Converts typical decoded message to multiple observations', () => {
    
    const resultTimeIso = '2018-08-28T10:18:12.000Z';

    const decoded = {
      device: '123ABC',
      time: new Date(resultTimeIso),
      rssi: -101,
      data: {
        temp: 20,
        humid: 57,
        pm1: 5, 
        pm25: 6,
        pm10: 7
      }
    };

    const expected = [
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 20,
          unit: 'degree-celsius'
        },
        madeBySensor: 'arduino-pm-123abc-sht85', // note that the sigfox ID is made all lowercase
        observedProperty: 'air-temperature',
        aggregation: 'instant'
      },
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 57,
          unit: 'percent'
        },
        madeBySensor: 'arduino-pm-123abc-sht85', // note that the sigfox ID is made all lowercase
        observedProperty: 'relative-humidity',
        aggregation: 'instant'
      },
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 5,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'arduino-pm-123abc-pms5003', // note that the sigfox ID is made all lowercase
        observedProperty: 'pm1-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 6,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'arduino-pm-123abc-pms5003', // note that the sigfox ID is made all lowercase
        observedProperty: 'pm2p5-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 7,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'arduino-pm-123abc-pms5003', // note that the sigfox ID is made all lowercase
        observedProperty: 'pm10-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: -101,
          unit: 'decibel'
        },
        madeBySensor: 'arduino-pm-123abc-basestation', // note that the sigfox ID is made all lowercase
        observedProperty: 'received-signal-strength-indicator',
        aggregation: 'instant'
      },
    ];

    const observations = decodedMessageToObservations(decoded);
    expect(observations).toEqual(expected);


  });

});