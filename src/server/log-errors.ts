import * as logger from 'node-logger';
import {EventStreamOperationalError} from 'event-stream';
import {OperationalError} from '../errors/OperationalError';

export function logRouteErrors(err, req, res, next): void {

  //------------------------
  // Operational errors
  //------------------------
  if (err instanceof OperationalError || err instanceof EventStreamOperationalError) {

    // Less serious
    logger.warn(err);
    
  //------------------------
  // Programmer errors
  //------------------------
  } else {
    logger.error(err);
  }

  next(err);

};