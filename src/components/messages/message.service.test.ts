import {DeviceApp} from '../device/device-app.interface';
import {decodeArduinoPmHexString, decodeMessage, decodedMessageToObservations, applyCalibration} from './message.service';

describe('Testing of decodeArduinoPmHexString function', () => {

  test('Converts a typical hex string as expected', () => {
    
    const hexString = '9a1d4c5c0c09ed0c830f0000';

    const expected = {
      temp: 27.75,
      humid: 39.66,
      pm1: 7, 
      pm2p5: 10,
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
      device: '123abc',
      time: new Date('2018-08-28T10:18:12.000Z'),
      data: {
        temp: 27.75,
        humid: 39.66,
        pm1: 7, 
        pm2p5: 10,
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
      device: '123abc',
      time: new Date('2018-08-28T10:18:12.000Z'),
      rssi: -101,
      data: {
        temp: 27.75,
        humid: 39.66,
        pm1: 7, 
        pm2p5: 10,
        pm10: 12
      }
    };

    const decoded = decodeMessage(message);
    expect(decoded).toEqual(expected);

  });

});



describe('Testing of decodedMessageToObservations function (without calibration)', () => {

  test('Converts typical decoded message to multiple observations', () => {
    
    const resultTimeIso = '2018-08-28T10:18:12.000Z';

    const decoded = {
      device: '123abc',
      time: new Date(resultTimeIso),
      rssi: -101,
      data: {
        temp: 20,
        humid: 57,
        pm1: 5, 
        pm2p5: 6,
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



describe('Testing of decodedMessageToObservations function (with calibration)', () => {

  test('Converts typical decoded message to multiple observations', () => {
    
    const resultTimeIso = '2018-08-28T10:18:12.000Z';

    const decoded = {
      device: '123abc',
      time: new Date(resultTimeIso),
      rssi: -101,
      data: {
        temp: 20,
        humid: 57,
        pm1: 5, 
        pm2p5: 6,
        pm10: 7
      }
    };

    const deviceOnRecord: DeviceApp = {
      id: '123abc',
      lastMessageAt: new Date('2020-09-21T17:07:33.826Z'),
      pm1: {
        lt85: {m: 1.1, c: 0.1},
        gte85: {m: 1.1, c: 0.2}
      },
      pm2p5: {
        lt85: {m: 0.9, c: -0.1},
        gte85: {m: 0.98, c: -0.1}
      },
      pm10: {
        lt85: {m: 1.2, c: -0.3},
        gte85: {m: 1.01, c: 0}
      }
    };

    const uncorrectedFlag = 'raw';
    const calibrationProcedure = 'arduino-pm-calibration-correction-v2';

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
        madeBySensor: 'arduino-pm-123abc-sht85',
        observedProperty: 'relative-humidity',
        aggregation: 'instant'
      },
      // PM1
      // Corrected
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 4.45,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'arduino-pm-123abc-pms5003',
        observedProperty: 'pm1-mass-concentration',
        aggregation: 'instant',
        usedProcedures: [calibrationProcedure]
      },
      // Uncorrected
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 5,
          unit: 'microgram-per-cubic-metre',
          flags: [uncorrectedFlag]
        },
        madeBySensor: 'arduino-pm-123abc-pms5003',
        observedProperty: 'pm1-mass-concentration',
        aggregation: 'instant'
      },
      // PM2.5
      // Corrected
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 6.78,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'arduino-pm-123abc-pms5003',
        observedProperty: 'pm2p5-mass-concentration',
        aggregation: 'instant',
        usedProcedures: [calibrationProcedure]
      },
      // Uncorrected
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 6,
          unit: 'microgram-per-cubic-metre',
          flags: [uncorrectedFlag]
        },
        madeBySensor: 'arduino-pm-123abc-pms5003',
        observedProperty: 'pm2p5-mass-concentration',
        aggregation: 'instant'
      },
      // PM10
      // Corrected
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 6.08,
          unit: 'microgram-per-cubic-metre'
        },
        madeBySensor: 'arduino-pm-123abc-pms5003',
        observedProperty: 'pm10-mass-concentration',
        aggregation: 'instant',
        usedProcedures: [calibrationProcedure]
      },
      // Uncorrected
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: 7,
          unit: 'microgram-per-cubic-metre',
          flags: [uncorrectedFlag]
        },
        madeBySensor: 'arduino-pm-123abc-pms5003',
        observedProperty: 'pm10-mass-concentration',
        aggregation: 'instant'
      },
      {
        resultTime: resultTimeIso,
        hasResult: {
          value: -101,
          unit: 'decibel'
        },
        madeBySensor: 'arduino-pm-123abc-basestation',
        observedProperty: 'received-signal-strength-indicator',
        aggregation: 'instant'
      },
    ];

    const observations = decodedMessageToObservations(decoded, deviceOnRecord);
    expect(observations).toEqual(expected);

  });

});


describe('Testing of applyCalibration function', () => {

  test('Apply calibration correction correctly (lt85)', () => {
    
    const uncorrectedValue = 22.3;
    const humidityValue = 50;
    const calibration = {
      lt85: {m: 1.1, c: 0.3},
      gte85: {m: 1.2, c: 0.2}
    };
    const expected = 20;
    const correctedValue = applyCalibration(uncorrectedValue, humidityValue, calibration);
    expect(correctedValue).toBe(expected);

  });

  test('Apply calibration correction correctly (gte85)', () => {
    
    const uncorrectedValue = 24.2;
    const humidityValue = 90;
    const calibration = {
      lt85: {m: 1.1, c: 0.5},
      gte85: {m: 1.2, c: 0.2}
    };
    const expected = 20;
    const correctedValue = applyCalibration(uncorrectedValue, humidityValue, calibration);
    expect(correctedValue).toBe(expected);

  });

  test('Applies m = 1, c = 0 calibration correction correctly', () => {
    
    const uncorrectedValue = 22.3;
    const humidityValue = 50;
    const calibration = {
      lt85: {m: 1, c: 0},
      gte85: {m: 1, c: 0}
    };
    const expected = 22.3;
    const correctedValue = applyCalibration(uncorrectedValue, humidityValue, calibration);
    expect(correctedValue).toBe(expected);

  });

});