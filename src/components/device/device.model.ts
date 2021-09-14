//-------------------------------------------------
// Dependencies
//-------------------------------------------------
import * as mongoose from 'mongoose';

//-------------------------------------------------
// Schema
//-------------------------------------------------
const calibrationSchema = new mongoose.Schema({
  // Calibration correction values, i.e. for "Correct Reading" = m("Erroneous Reading") + c
  lt85: {
    m: {
      type: Number,
      required: true
    },
    c: {
      type: Number,
      required: true
    } 
  },
  gte85: {
    m: {
      type: Number,
      required: true
    },
    c: {
      type: Number,
      required: true
    }
  }
},
{
  _id : false // don't want an id being added to these nested objects
});

const schema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    immutable: true, // prevents this from being updated
    maxlength: [6, 'id is too long'] // Sigfox device IDs shouldn't be longer than this
  },
  lastMessageAt: { 
    type: Date // the time of the latest sigfox callback
  },
  pm1: {
    type: calibrationSchema
  },
  pm2p5: {
    type: calibrationSchema
  },
  pm10: {
    type: calibrationSchema
  }
});



//-------------------------------------------------
// Create Model (and expose it to our app)
//-------------------------------------------------
export default mongoose.model('Device', schema);