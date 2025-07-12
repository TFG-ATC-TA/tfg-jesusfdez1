/**
 * Modelo de Equipment - Gestión de equipos de la granja
 * Maneja tanques de leche y estaciones de lavado con sus dispositivos asociados
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Esquema de Equipment
 * Define la estructura de datos para los equipos de la granja
 */
var equipmentSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["Tanque de leche", "Estación de lavado"]
    },
    description: {
        type: String,
        required: false
    },
    farm: {
        type: Schema.Types.ObjectId,
        ref: 'Farm'
    },
    devices: [{
        type: Schema.Types.ObjectId,
        ref: 'Device'
    }],
    associatedTanks: [{
        type: Schema.Types.ObjectId,
        ref: 'Equipment',
        validate: {
            validator: async function(v) {
                const equipment = await mongoose.model('Equipment').findById(v);
                return equipment && equipment.type === "Tanque de leche";
            },
            message: 'Solo los tanques de leche pueden ser asociados'
        }
    }]
});

/**
 * Validación pre-save para verificar que solo estaciones de lavado pueden tener tanques asociados
 * Se ejecuta antes de guardar para asegurar la integridad de los datos
 */
equipmentSchema.pre('save', function(next) {
    if (this.associatedTanks && this.associatedTanks.length > 0 && this.type !== 'Estación de lavado') {
        const error = new Error('Solo las estaciones de lavado pueden tener tanques asociados');
        error.name = 'ValidationError';
        error.errors = {
            associatedTanks: {
                message: 'Solo las estaciones de lavado pueden tener tanques asociados',
                name: 'ValidatorError',
                path: 'associatedTanks',
                value: this.associatedTanks
            }
        };
        return next(error);
    }
    next();
});

module.exports = mongoose.model('Equipment', equipmentSchema);