/**
 * Modelo de Granja - Gestión de granjas del sistema
 * Maneja las relaciones con usuarios, equipos y dispositivos
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Esquema de Granja
 * Define la estructura de datos para las granjas del sistema
 */
var farmSchema = new Schema({
    _id: {
      type: Schema.Types.ObjectId,
      auto: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  idname: {
    type: String,
    required: true,
    unique: true,
  },
  users: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  }],
  equipments: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Equipment" 
  }],
  devices: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Device" 
  }],
});

/**
 * Hook pre-remove para limpiar referencias al eliminar granja
 * Se ejecuta antes de eliminar una granja para limpiar referencias en otros modelos
 */
farmSchema.pre(['findOneAndDelete', 'deleteOne', 'remove'], async function(next) {
  try {
      // Para deleteOne/findOneAndDelete necesitamos obtener el documento primero
      const farmId = this.getQuery()._id;
      
      // Eliminar referencia de la granja en todos los usuarios asociados
      await mongoose.model('User').updateMany(
          { farms: farmId },
          { $pull: { farms: farmId } }
      );

      // Eliminar referencia de la granja en todos los equipos asociados
      await mongoose.model('Equipment').updateMany(
          { farm: farmId },
          { $unset: { farm: "" } }
      );

      // Eliminar referencia de la granja en todos los dispositivos asociados
      await mongoose.model('Device').updateMany(
          { farm: farmId },
          { $unset: { farm: "" } }
      );

      next();
  } catch (err) {
      next(err);
  }
});

/**
 * Hook pre-save para sincronizar relaciones con granjas
 * Mantiene las referencias bidireccionales entre granjas y sus elementos asociados
 */
farmSchema.pre('save', async function(next) {
  try {
      if (this.isModified('users') || this.isModified('equipments') || this.isModified('devices')) {
          // Eliminar referencias antiguas
          const oldFarm = await this.constructor.findById(this._id);
          if (oldFarm) {
              // Limpiar referencias en usuarios
              await mongoose.model('User').updateMany(
                  { farms: oldFarm._id },
                  { $pull: { farms: oldFarm._id } }
              );
              // Limpiar referencias en equipos
              await mongoose.model('Equipment').updateMany(
                  { farm: oldFarm._id },
                  { $unset: { farm: "" } }
              );
              // Limpiar referencias en dispositivos
              await mongoose.model('Device').updateMany(
                  { farm: oldFarm._id },
                  { $unset: { farm: "" } }
              );
          }

          // Agregar nuevas referencias en usuarios
          await mongoose.model('User').updateMany(
              { _id: { $in: this.users } },
              { $addToSet: { farms: this._id } }
          );
          
          // Verificar si el modelo Equipment existe antes de usarlo
          try {
            const Equipment = mongoose.model('Equipment');
            await Equipment.updateMany(
                { _id: { $in: this.equipments } },
                { $set: { farm: this._id } }
            );
          } catch (error) {
            // Si el modelo no está registrado, simplemente ignorar
            if (error.name !== 'MissingSchemaError') {
              throw error;
            }
          }
          
          // Agregar nuevas referencias en dispositivos
          await mongoose.model('Device').updateMany(
              { _id: { $in: this.devices } },
              { $set: { farm: this._id } }
          );
      }
      next();
  } catch (err) {
      next(err);
  }
});

module.exports = mongoose.model("Farm", farmSchema);
