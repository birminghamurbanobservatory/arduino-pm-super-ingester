import {connectDb, disconnectDb} from '../db/mongodb-service';
import * as MongodbMemoryServer from 'mongodb-memory-server';
import * as logger from 'node-logger';
import {config} from '../config';
import supertest from 'supertest';
import * as event from 'event-stream';
import {getDevices, upsertDevice} from '../components/device/device.service';

//-------------------------------------------------
// Mocks
//-------------------------------------------------
jest.mock('event-stream');


//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('End to end testing of the devices', () => {

  let mongoServer;
  let request;

  beforeAll(() => {
    // Configure the logger
    logger.configure(config.logger);
  });

  beforeEach(() => {
    // Load our express.js app
    const app = require('../server').app;
    request = supertest(app);
    // Create fresh database
    mongoServer = new MongodbMemoryServer.MongoMemoryServer();
    return mongoServer.getConnectionString()
    .then((url) => {
      return connectDb(url);
    });
  });

  afterEach(() => {
    // Reset mock.calls and mock.instances properties of all mocks
    jest.clearAllMocks();
    // Disconnect from, then stop, database.
    return disconnectDb()
    .then(() => {
      mongoServer.stop();
      return;
    });
  }); 



  test('A device insert following a new message works as expected', async () => {

    expect.assertions(2); // Supertest's .expect()'s don't count towards the total.

    // event.publish returns a promise, so we use mockResolvedValue to specify the value the mock should return.
    event.publish.mockResolvedValue();

    await request
    .post('/messages')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      device: '123ABC',
      data: '5515a784c107c107c1070000',
      time: 1535451492    
    })
    .expect(200);

    const devices = await getDevices();
    expect(devices.length).toBe(1);
    const insertedDevice = devices[0];
    expect(insertedDevice).toEqual({
      id: '123abc',
      lastMessageAt: new Date(1535451492 * 1000),
    });

  });


  test('A user should be able to change the m and c values through the API', async () => {
    
    expect.assertions(2);

    // Create an initial record in the database
    const deviceId = '123abc';
    const messageTime = new Date('2020-09-21T17:07:33.826Z');
    const initialDevice = await upsertDevice(deviceId, {lastMessageAt: messageTime});
    expect(initialDevice).toEqual({
      id: deviceId,
      lastMessageAt: messageTime
    });

    const updateDeviceResponse = await request
    .post('/devices/123abc')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      pm1: {
        lt85: {
          m: 1.2,
          c: 0.3
        },
        gte85: {
          m: 1.1,
          c: 0.2
        }
      }
    })
    .expect(200);

    const updatedDevice = updateDeviceResponse.body;
    expect(updatedDevice).toEqual({
      id: deviceId,
      lastMessageAt: messageTime.toISOString(),
      pm1: {
        lt85: {
          m: 1.2,
          c: 0.3
        },
        gte85: {
          m: 1.1,
          c: 0.2
        }
      }
    });
    
  });


  test('Get details of a single device', async() => {

    expect.assertions(1);

    // Create an initial record in the database
    const deviceId = '123abc';
    const messageTime = new Date('2020-09-21T17:07:33.826Z');
    await upsertDevice(deviceId, {
      lastMessageAt: messageTime,
      pm1: {
        lt85: {m: 1.2, c: 0.3},
        gte85: {m: 1.1, c: 0.2}
      },
      pm2p5: {
        lt85: {m: 0.99, c: 0.3},
        gte85: {m: 0.98, c: -0.1}
      },
      pm10: {
        lt85: {m: 1, c: 0},
        gte85: {m: 1.01, c: 0}
      },
    });

    const response = await request
    .get('/devices/123abc')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .expect(200);

    expect(response.body).toEqual({
      id: deviceId,
      lastMessageAt: messageTime.toISOString(),
      pm1: {
        lt85: {m: 1.2, c: 0.3},
        gte85: {m: 1.1, c: 0.2}
      },
      pm2p5: {
        lt85: {m: 0.99, c: 0.3},
        gte85: {m: 0.98, c: -0.1}
      },
      pm10: {
        lt85: {m: 1, c: 0},
        gte85: {m: 1.01, c: 0}
      },
    });

  });


  test('A user should be able to unset m and c values through the API', async () => {
    
    expect.assertions(1);

    // Create an initial record in the database
    const deviceId = '123abc';
    const messageTime = new Date('2020-09-21T17:07:33.826Z');
    await upsertDevice(deviceId, {
      lastMessageAt: messageTime,
      pm1: {
        lt85: {
          m: 1.2,
          c: 0.3
        },
        gte85: {
          m: 1.1,
          c: 0.2
        }
      },
      pm10: {
        lt85: {
          m: 0.99,
          c: 0.3
        },
        gte85: {
          m: 0.98,
          c: -0.1
        }
      },
    });

    const updateDeviceResponse = await request
    .post('/devices/123abc')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      pm1: null
    })
    .expect(200);

    const updatedDevice = updateDeviceResponse.body;
    expect(updatedDevice).toEqual({
      id: deviceId,
      lastMessageAt: messageTime.toISOString(),
      // pm1 should no longer be in here
      pm10: {
        lt85: {
          m: 0.99,
          c: 0.3
        },
        gte85: {
          m: 0.98,
          c: -0.1
        }
      },
    });
    
  });


  test('User should be able to create a new device through the API', async () => {

    // I.e. before any messages have come through for it yet.
    
    const createDeviceResponse = await request
    .post('/devices/123abc')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      pm1: {
        lt85: {m: 1.2, c: 0.3},
        gte85: {m: 1.1, c: 0.2}
      },
      pm2p5: {
        lt85: {m: 0.99, c: 0.3},
        gte85: {m: 0.98, c: -0.1}
      },
      pm10: {
        lt85: {m: 1, c: 0},
        gte85: {m: 1.01, c: 0}
      },
    })
    .expect(200);

    const createdDevice = createDeviceResponse.body;
    expect(createdDevice).toEqual({
      id: '123abc',
      pm1: {
        lt85: {m: 1.2, c: 0.3},
        gte85: {m: 1.1, c: 0.2}
      },
      pm2p5: {
        lt85: {m: 0.99, c: 0.3},
        gte85: {m: 0.98, c: -0.1}
      },
      pm10: {
        lt85: {m: 1, c: 0},
        gte85: {m: 1.01, c: 0}
      },
    });

  });



  test(`A user should not be able to change a device's lastMessageAt value through the API`, async () => {
    
    expect.assertions(1);

    const response = await request
    .post('/devices/123abc')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      lastMessageAt: '2020-09-21T17:07:33.826Z',
    })
    .expect(400);

    expect(response.body.errorCode).toBe('InvalidBody');

  });



  test('A user should not be able to change the device id value through the API', async () => {
    
    expect.assertions(1);

    const response = await request
    .post('/devices/123abc')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      id: '456cba',
    })
    .expect(400);

    expect(response.body.errorCode).toBe('InvalidBody');

  });


  test('Can get a list of devices through the API', async () => {
    
    expect.assertions(1);

    // Create first device
    await upsertDevice('abc123', {
      pm1: {
        lt85: {m: 1.2, c: 0.3},
        gte85: {m: 1.1, c: 0.2}
      },
      pm2p5: {
        lt85: {m: 0.99, c: 0.3},
        gte85: {m: 0.98, c: -0.1}
      },
      pm10: {
        lt85: {m: 1, c: 0},
        gte85: {m: 1.01, c: 0}
      },
    });
    // Create second device
    await upsertDevice('def456', {lastMessageAt: new Date('2020-09-21T17:07:33.826Z')});

    const response = await request
    .get('/devices')
    .set('x-api-key', config.api.key)
    .expect(200);

    expect(response.body).toEqual([
      {
        id: 'abc123',
        pm1: {
          lt85: {m: 1.2, c: 0.3},
          gte85: {m: 1.1, c: 0.2}
        },
        pm2p5: {
          lt85: {m: 0.99, c: 0.3},
          gte85: {m: 0.98, c: -0.1}
        },
        pm10: {
          lt85: {m: 1, c: 0},
          gte85: {m: 1.01, c: 0}
        },
      },
      {
        id: 'def456',
        lastMessageAt: '2020-09-21T17:07:33.826Z'
      }
    ]);

  });



  test('Make sure the device list is only accessible with a api key', async () => {

    await request
    .get('/devices')
    .expect(401);

  });


  test('Make sure the device list is only accessible with a valid api key', async () => {
  
    await request
    .get('/devices')
    .set('x-api-key', 'wrong-api-key')
    .expect(403);

  });



});