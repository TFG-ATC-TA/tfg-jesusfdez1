/**
 * Modelo de Collection - Gestión de recolección de leche
 * Maneja los datos de recolección de leche de las granjas
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Esquema de Collection
 * Define la estructura de datos para las recolecciones de leche
 */
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


