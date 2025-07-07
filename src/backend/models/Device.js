var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const deviceSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true
    },
    boardId: 
    { 
        type: String, 
        required: true, 
        unique: true 
    },
    type: 
    { 
        type: String, 
        required: true, 
        enum: ["Monitor de leche", "Monitor de tanque", "Monitor de estación de lavado"] 
    },
    farm: { 
        type: Schema.Types.ObjectId, 
        ref: "Farm" 
    },
    equipment: { 
        type: Schema.Types.ObjectId, 
        ref: "Equipment" 
    },
    description: String,
    sensors: [
        {
            sensorId: { 
                type: String, 
                required: true, 
                unique: true 
            },
            name: String,
        }
    ]
});

deviceSchema.pre('save', async function(next) {
    try {
     if (this.isModified('farm') || this.isModified('equipment')) {
      // Eliminar la referencia del dispositivo de la granja y equipo anterior
      const oldDevice = await this.constructor.findById(this._id);
      if (oldDevice) {
        if (oldDevice.farm) {
          await mongoose.model('Farm').updateOne(
            { _id: oldDevice.farm },
            { $pull: { devices: oldDevice._id } }
          );
        }
        if (oldDevice.equipment) {
          await mongoose.model('Equipment').updateOne(
            { _id: oldDevice.equipment },
            { $pull: { devices: oldDevice._id } }
          );
        }
      }
    }
  
      // Agregar la referencia del dispositivo a la nueva granja y equipo
      if (this.farm) {
        await mongoose.model('Farm').updateOne(
          { _id: this.farm },
          { $addToSet: { devices: this._id } }
        );
      }
      if (this.equipment) {
        await mongoose.model('Equipment').updateOne(
          { _id: this.equipment },
          { $addToSet: { devices: this._id } }
        );
      }
  
      next();
    } catch (err) {
      next(err);
    }
  });

deviceSchema.pre(['remove', 'deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function(next) {
    try {
        let deviceId = this._id;
        
        // Para operaciones de query, obtener el documento
        if (!deviceId) {
            const doc = await this.model.findOne(this.getQuery());
            if (doc) deviceId = doc._id;
        }
        
        if (deviceId) {
            await mongoose.model('Farm').updateOne(
                { devices: deviceId },
                { $pull: { devices: deviceId } }
            );
            await mongoose.model('Equipment').updateOne(
                { devices: deviceId },
                { $pull: { devices: deviceId } }
            );
        }
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("Device", deviceSchema);