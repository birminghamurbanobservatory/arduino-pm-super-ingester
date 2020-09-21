import {RawMessage} from './raw-message';
import {validateMessage, decodeMessage, decodedMessageToObservations} from './message.service';
import {publishObservations} from '../../events/publish-observations';
import {getDevice, upsertDevice} from '../device/device.service';


export async function incomingMessageController(message: RawMessage): Promise<string> {

  // validate the message
  validateMessage(message);

  const decoded = decodeMessage(message);

  // Check to see if we have a record of this device in our database
  let deviceOnRecord;
  try {
    deviceOnRecord = await getDevice(decoded.device);
  } catch (err) {
    if (err.name !== 'DeviceNotFound') {
      throw err;
    }
  }

  // Now to convert the decoded message into valid Urban Obs observations
  const observations = decodedMessageToObservations(decoded, deviceOnRecord);

  // Update our database record
  await upsertDevice(decoded.device, {lastMessageAt: decoded.time});

  // Send the observations to the event-stream
  await publishObservations(observations);

  return 'Message successfully received';

}