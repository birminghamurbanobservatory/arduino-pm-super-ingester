//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {config} from '../../config';
import * as logger from 'node-logger';
import {Unauthorized} from '../../errors/Unauthorized';
import {InvalidApiKey} from '../../errors/InvalidApiKey';

const apiKey = config.sigfox.apiKey;


//-------------------------------------------------
// Check API Key
//-------------------------------------------------
export function checkApiKey(req, res, next): any {

  logger.debug('Checking API Key');

  // Check if an apiKey is present in the authorization header
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'apiKey') {

    const sentKey = req.headers.authorization.split(' ')[1];

    // Does the key sent by the request match the one we have on record?
    if (sentKey === apiKey) {

      logger.debug('apiKey is valid');
      next();

    } else {

      logger.debug('apiKey is invalid');
      return next(new InvalidApiKey(`Invalid API Key: '${sentKey}'`));

    }

  } else {
    logger.debug('No apiKey present');
    return next(new Unauthorized('You must provide an apiKey in the Authorization header, e.g. Authorization: apiKey abc123'));
  }
  
}