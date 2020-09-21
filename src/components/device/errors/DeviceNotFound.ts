import {NotFound} from '../../../errors/NotFound';

export class DeviceNotFound extends NotFound {

  public constructor(message = 'Device could not be found') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain   
  }

}