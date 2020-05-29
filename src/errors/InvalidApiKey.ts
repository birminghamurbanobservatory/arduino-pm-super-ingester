import {Forbidden} from './Forbidden';

export class InvalidApiKey extends Forbidden {

  public constructor(message = 'Invalid API Key') {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain      
  }

}