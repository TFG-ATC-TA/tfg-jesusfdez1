/**
 * Modelo de Device - Gestión de dispositivos IoT del sistema
 * Maneja las relaciones con granjas y equipos, así como los sensores asociados
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Esquema de Device
 * Define la estructura de datos para los dispositivos IoT del sistema
 */
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

/**
 * Hook pre-save para sincronizar relaciones con granjas y equipos
 * Mantiene las referencias bidireccionales entre dispositivos y sus elementos asociados
 */
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

/**
 * Hook pre-remove para limpiar referencias al eliminar dispositivo
 * Se ejecuta antes de eliminar un dispositivo para limpiar referencias en otros modelos
 */
deviceSchema.pre(['remove', 'deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function(next) {
    try {
        let deviceId = this._id;
        
        // Para operaciones de query, obtener el documento
        if (!deviceId) {
            const doc = await this.model.findOne(this.getQuery());
            if (doc) deviceId = doc._id;
        }
        
        if (deviceId) {
            // Eliminar referencia del dispositivo en la granja asociada
            await mongoose.model('Farm').updateOne(
                { devices: deviceId },
                { $pull: { devices: deviceId } }
            );
            // Eliminar referencia del dispositivo en el equipo asociado
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