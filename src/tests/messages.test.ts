

//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import supertest from 'supertest';
import * as event from 'event-stream';
import * as logger from 'node-logger';
import {config} from '../config';
import * as check from 'check-types';
import * as MongodbMemoryServer from 'mongodb-memory-server';
import {connectDb, disconnectDb} from '../db/mongodb-service';

//-------------------------------------------------
// Mocks
//-------------------------------------------------
jest.mock('event-stream');


//-------------------------------------------------
// Tests
//-------------------------------------------------
describe('Testing messages endpoint', () => {

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


  test('Testing end-to-end from message received to event published', async () => {

    expect.assertions(5); // Supertest's .expect()'s don't count towards the total.

    // event.publish returns a promise, so we use mockResolvedValue to specify the value the mock should return.
    event.publish.mockResolvedValue();

    const response = await request
    .post('/messages')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      device: '123456',
      data: '5515a784c107c107c1070000',
      time: 1535451492    
    })
    .expect(200);
    
    expect(response.text).toBe('Message successfully received');
    expect(event.publish.mock.calls.length).toBe(5); // i.e. one for each observed property.
    expect(event.publish.mock.calls[0][0]).toBe('observation.incoming');
    expect(check.nonEmptyObject(event.publish.mock.calls[0][1])).toBe(true);
    expect(event.publish.mock.calls[0][1]).toHaveProperty('hasResult');
    
  });


  test('Should return a 202 if the data is incorrectly formatted', async () => {

    expect.assertions(1); // Supertest's .expect()'s don't count towards the total.

    // event.publish returns a promise, so we use mockResolvedValue to specify the value the mock should return.
    event.publish.mockResolvedValue();

    const response = await request
    .post('/messages')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      foobar: '123456',
      data: '222',
      timesssss: 1535451492    
    })
    .expect(202);
    
    // It shouldn't call the event-stream
    expect(event.publish.mock.calls.length).toBe(0);

  });


  test('Testing end-to-end from message received to event published (with calibration applied)', async () => {

    expect.assertions(3); // Supertest's .expect()'s don't count towards the total.

    // event.publish returns a promise, so we use mockResolvedValue to specify the value the mock should return.
    event.publish.mockResolvedValue();

    const deviceId = 'abc123';

    // Add some calibration settings
    await request
    .post(`/devices/${deviceId}`)
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      pm1: {
        m: 1.2,
        c: 0.3
      },
      pm2p5: {
        m: 0.9,
        c: 0.3
      },
      pm10: {
        m: 1.1,
        c: 0.2
      }
    })
    .expect(200);

    // Simulate new data from sigfox
    const response = await request
    .post('/messages')
    .set('Accept', 'application/json')
    .set('x-api-key', config.api.key)
    .send({
      device: deviceId,
      data: '5515a784c107c107c1070000',
      time: 1535451492    
    })
    .expect(200);
    
    expect(response.text).toBe('Message successfully received');
    expect(event.publish.mock.calls.length).toBe(8); // i.e. one for each observed property + plus 3 corrected obs
    expect(event.publish.mock.calls[0][0]).toBe('observation.incoming');
    
  });



});