var mongoose = require("mongoose");
var Schema = mongoose.Schema;

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

farmSchema.pre(['findOneAndDelete', 'deleteOne', 'remove'], async function(next) {
  try {
      // Para deleteOne/findOneAndDelete necesitamos obtener el documento primero
      const farmId = this.getQuery()._id;
      
      await mongoose.model('User').updateMany(
          { farms: farmId },
          { $pull: { farms: farmId } }
      );

      await mongoose.model('Equipment').updateMany(
          { farm: farmId },
          { $unset: { farm: "" } }
      );

      await mongoose.model('Device').updateMany(
          { farm: farmId },
          { $unset: { farm: "" } }
      );

      next();
  } catch (err) {
      next(err);
  }
});


farmSchema.pre('save', async function(next) {
  try {
      if (this.isModified('users') || this.isModified('equipments') || this.isModified('devices')) {
          // Eliminar referencias antiguas
          const oldFarm = await this.constructor.findById(this._id);
          if (oldFarm) {
              await mongoose.model('User').updateMany(
                  { farms: oldFarm._id },
                  { $pull: { farms: oldFarm._id } }
              );
              await mongoose.model('Equipment').updateMany(
                  { farm: oldFarm._id },
                  { $unset: { farm: "" } }
              );
              await mongoose.model('Device').updateMany(
                  { farm: oldFarm._id },
                  { $unset: { farm: "" } }
              );
          }

          // Agregar nuevas referencias
          await mongoose.model('User').updateMany(
              { _id: { $in: this.users } },
              { $addToSet: { farms: this._id } }
          );
          await mongoose.model('Equipment').updateMany(
              { _id: { $in: this.equipments } },
              { $set: { farm: this._id } }
          );
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
