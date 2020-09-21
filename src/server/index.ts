import * as bodyParser from 'body-parser';
import methodOverride from 'method-override';
import express from 'express';
import {correlationIdMiddleware} from './middleware/correlator-id-middleware';
import {MessageRouter} from '../components/messages/message.router';
import morgan = require('morgan');
import * as logger from 'node-logger';
import {logRouteErrors} from './log-errors';
import {handleRouteErrors} from './handle-errors';
import {DeviceRouter} from '../components/device/device.router';

export const app = express();


//-------------------------------------------------
// Middleware
//-------------------------------------------------
// Add the correlationId middleware
app.use(correlationIdMiddleware);


// Allow for POST requests
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.use(methodOverride());


// Get rid of the unnecessary header X-Powered-By: Express
app.disable('x-powered-by'); 

// Logs this as soon as the request comes in
app.use(morgan(`:method :url`, {
  stream: {write: (text) => logger.debug(text.trim())},
  immediate: true,
}));
// Logs this as the response goes out
app.use(morgan(`:method :status :url (:res[content-length] bytes) :response-time ms`, {
  stream: {write: (text) => logger.debug(text.trim())},
  immediate: false,
}));

// Catch malformed body
// By default the bodyParser middleware returns its own error when the request body has invalid syntax, e.g the json message didn't close an open quotation mark. bodyParser gives these errors an instance of SyntaxError, with a status of 400, and a body property, giving us a way of catching just these types of error. Works on verbs other than just POST.
// For some reason if I try to move this code into a route it no longer works.
app.use('/', (err, req, res, next) => {
  // @ts-ignore: In this instance SyntaxError does have a status property
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // TODO: use a custom error here, e.g. InvalidBody.
    return next(new Error('The request body is malformed'));
  } else {
    next();
  }
});


// Routers
app.use(MessageRouter);
app.use(DeviceRouter);


// Error handling must go last
app.use(logRouteErrors);
app.use(handleRouteErrors);


// Handle routes that don't exist (this must go at the end)
app.use((req, res): any => {
  return res.status(404).send('This API endpoint has not been defined.')
});