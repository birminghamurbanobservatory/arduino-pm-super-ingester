

//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import supertest from 'supertest';
import * as event from 'event-stream';
import * as logger from 'node-logger';
import {config} from '../config';
import * as check from 'check-types';


//-------------------------------------------------
// Mocks
//-------------------------------------------------
jest.mock('event-stream');


describe('Testing messages endpoint', () => {

  let request;

  beforeAll(() => {
    // Configure the logger
    logger.configure(config.logger);
  });

  beforeEach(() => {
    // Load our express.js app
    const app = require('../server').app;
    request = supertest(app);
  });

  afterEach(() => {
    // Reset mock.calls and mock.instances properties of all mocks
    jest.clearAllMocks();
  });


  test('Testing end-to-end from message received to event published', async () => {

    expect.assertions(4); // Supertest's .expect()'s don't count towards the total.

    // event.publish returns a promise, so we use mockResolvedValue to specify the value the mock should return.
    event.publish.mockResolvedValue();

    const response = await request
    .post('/messages')
    .set('Accept', 'application/json')
    .set('Authorization', `apiKey ${config.sigfox.apiKey}`)
    .send({
      device: '123456',
      data: '1234',
      time: 1535451492    
    })
    .expect(200);
    

    expect(response.text).toBe('Message successfully received');
    expect(event.publish.mock.calls.length).toBe(1);
    expect(event.publish.mock.calls[0][0]).toBe('observation.incoming');
    expect(check.nonEmptyObject(event.publish.mock.calls[0][1])).toBe(true);
    
  });


  




});