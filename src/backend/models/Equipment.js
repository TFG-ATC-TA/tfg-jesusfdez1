var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    farm: {
        type: Schema.Types.ObjectId,
        ref: 'Farm'
    },
    device: [{
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
            message: 'Solo los tanques de leche pueden tener asociados tanques'
        }
    }]
});

module.exports = mongoose.model('Equipment', equipmentSchema);