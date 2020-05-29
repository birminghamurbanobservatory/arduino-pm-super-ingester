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

  const response = await incomingMessageController(req.body);

  return res.send(response);

}));