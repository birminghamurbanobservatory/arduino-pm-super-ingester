//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {config} from '../../config';
import * as logger from 'node-logger';
import {Unauthorized} from '../../errors/Unauthorized';
import {InvalidApiKey} from '../../errors/InvalidApiKey';

const apiKey = config.api.key;

//-------------------------------------------------
// Check API Key
//-------------------------------------------------
export function checkApiKey(req, res, next): any {

  logger.debug('Checking API Key');

  const sentKey = req.headers['x-api-key'];

  // Check if an apiKey is present in the authorization header
  if (!sentKey) {
    logger.debug('No api key provided');
    return next(new Unauthorized('You must provide an API Key as the value of the x-api-key header'));
  }

  // Does the key sent by the request match the one we have on record?
  if (sentKey === apiKey) {

    logger.debug('apiKey is valid');
    next();

  } else {

    logger.debug('apiKey is invalid');
    return next(new InvalidApiKey(`Invalid API Key: '${sentKey}'`));

  }

}