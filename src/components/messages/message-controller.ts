import {RawMessage} from './raw-message';
import {validateMessage, decodeMessage, decodedMessageToObservations} from './message.service';
import {publishObservations} from '../../events/publish-observations';


export async function incomingMessageController(message: RawMessage): Promise<string> {

  // validate the message
  validateMessage(message);
  // TODO: need to handle when this errors as I probably want to return a 202 so that it doesn't resend. Need to decide where this should be handled. E.g. here, router, or in handle-errors.ts

  const decoded = decodeMessage(message);

  // Now to conver the decoded message into valid Urban Obs observations
  const observations = decodedMessageToObservations(decoded);

  // Send the observations to the event-stream
  publishObservations(observations);

  return 'Message successfully received';

}