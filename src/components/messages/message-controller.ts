import {RawMessage} from './raw-message';
import {validateMessage, decodeMessage, decodedMessageToObservations} from './message.service';
import {publishObservations} from '../../events/publish-observations';


export async function incomingMessageController(message: RawMessage): Promise<string> {

  // validate the message
  validateMessage(message);

  const decoded = decodeMessage(message);

  // Now to conver the decoded message into valid Urban Obs observations
  const observations = decodedMessageToObservations(decoded);

  // Send the observations to the event-stream
  await publishObservations(observations);

  return 'Message successfully received';

}