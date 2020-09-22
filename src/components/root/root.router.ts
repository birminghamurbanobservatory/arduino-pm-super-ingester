import * as logger from 'node-logger';
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import * as path from 'path';

const router = express.Router();

export {router as RootRouter};


//-------------------------------------------------
// GET Route
//-------------------------------------------------
router.get('/', asyncWrapper(async (req, res): Promise<any> => {

  return res.sendFile(path.join(`${__dirname}/root.html`));

}));