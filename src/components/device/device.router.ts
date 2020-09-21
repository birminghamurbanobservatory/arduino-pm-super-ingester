//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import express from 'express';
import {asyncWrapper} from '../../utils/async-wrapper';
import {checkApiKey} from '../common/check-api-key';
import * as joi from '@hapi/joi';
import {InvalidBody} from '../../errors/InvalidBody';
import {getDevices, updateDevice} from './device.controller';

const router = express.Router();

export {router as DeviceRouter};


//-------------------------------------------------
// All device requests
//-------------------------------------------------
router.use('/devices', checkApiKey);


//-------------------------------------------------
// Insert/Update Device
//-------------------------------------------------
const calibrationSchema = joi.object({
  m: joi.number().required(),
  c: joi.number().required()
});

const updateDeviceBodySchema = joi.object({
  pm1: calibrationSchema,
  pm2p5: calibrationSchema,
  pm10: calibrationSchema
}).min(1);

router.post('/devices/:deviceId', asyncWrapper(async (req, res): Promise<any> => {

  const deviceId = req.params.deviceId.toLowerCase();

  const {error: bodyErr, value: body} = updateDeviceBodySchema.validate(req.body);
  if (bodyErr) throw new InvalidBody(bodyErr.message);

  const response = await updateDevice(deviceId, body);
  return res.json(response);

}));



//-------------------------------------------------
// Get Devices
//-------------------------------------------------
router.get('/devices', asyncWrapper(async (req, res): Promise<any> => {
 
  const response = await getDevices();
  return res.json(response);

}));