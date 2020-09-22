
//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import {config} from './config';
import * as logger from 'node-logger';
const appName = require('../package.json').name; // Annoyingly if i use import here, the built app doesn't update.
import {app} from './server';
import {initialiseEvents} from './events/initialise-events';
import {getCorrelationId} from './utils/correlator';
import {connectDb} from './db/mongodb-service';


//-------------------------------------------------
// Logging
//-------------------------------------------------
logger.configure(Object.assign({}, config.logger, {getCorrelationId}));
logger.warn(`${appName} restarted`);


(async (): Promise<void> => {

  //-------------------------------------------------
  // Database
  //-------------------------------------------------
  try {
    await connectDb(config.mongo.uri);
    logger.info('Initial connection to MongoDB database was successful');
  } catch (err) {
    logger.error(`Initial MongoDB database connection failed: ${err.message}`);
  }

  //-------------------------------------------------
  // Event stream
  //-------------------------------------------------
  try {
    await initialiseEvents({
      url: config.events.url,
      appName,
      logLevel: config.events.logLevel
    });
  } catch (err) {
    logger.error('There was an issue whilst initialising events.', err);
  }
  return;

})();


//-------------------------------------------------
// Server
//-------------------------------------------------
const port = 8080;
app.listen(port, (): void => {
  logger.info(`Server is running on port ${port}`);
});