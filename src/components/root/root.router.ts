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

  // This is a bit of cheat to save me having to copy over the .html file into the dist directory.
  const filePath = path.join(__dirname, '../../../src/components/root/root.html');

  return res.sendFile(filePath);

}));