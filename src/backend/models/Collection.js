var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var collectionSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true
    },
    collectionDate: Date,
    cisternLicensePlate: String,
    collectionCompany: String,
    driver: String,
    tankId: String,
    sampleLabel: { 
        type: String, 
        unique: true, 
        required: true 
    },
    milkTemperature: Number,
    inhibitorSampleTaken: Boolean,
    litersPerTank: [
        {
            tankId: { type: Schema.Types.ObjectId, ref: 'Equipment' },
            liters: Number,
            compartment: String
        }
    ],
    farmId: {
        type: Schema.Types.ObjectId,
        ref: 'Farm'
    }
   // sample: { type: Schema.Types.ObjectId, ref: 'Sample' }
});

module.exports = mongoose.model('Collection', collectionSchema);


