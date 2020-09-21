import * as logger from 'node-logger';
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {incomingMessageController} from './message-controller';
import {checkApiKey} from '../common/check-api-key';

const router = express.Router();

export {router as MessageRouter};


// Check the API Key
router.use('/messages', checkApiKey);


//-------------------------------------------------
// Post
//-------------------------------------------------
router.post('/messages', asyncWrapper(async (req, res): Promise<any> => {

  let response;

  try {
    response = await incomingMessageController(req.body);

  } catch (err) {
    // When we fail to process the message we don't really want Sigfox to send it again, because chances are it will fail again, therefore we'll send a 202 message to signify that we failed to process it, but because it is a 2xx it won't try to send the callback again.
    logger.error(err);
    return res.status(202).send(err.message);
  }

  return res.send(response);

}));