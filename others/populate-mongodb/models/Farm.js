import mongoose from "mongoose";
const Schema = mongoose.Schema;

// Importar los modelos necesarios para los hooks
import User from "./User.js";
import Equipment from "./Equipment.js";
import Device from "./Device.js";

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

farmSchema.pre('remove', async function(next) {
  try {
      await User.updateMany(
          { farms: this._id },
          { $pull: { farms: this._id } }
      );

      await Equipment.updateMany(
          { farm: this._id },
          { $unset: { farm: "" } }
      );

      await Device.updateMany(
          { farm: this._id },
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
              await User.updateMany(
                  { farms: oldFarm._id },
                  { $pull: { farms: oldFarm._id } }
              );
              await Equipment.updateMany(
                  { farm: oldFarm._id },
                  { $unset: { farm: "" } }
              );
              await Device.updateMany(
                  { farm: oldFarm._id },
                  { $unset: { farm: "" } }
              );
          }

          // Agregar nuevas referencias
          await User.updateMany(
              { _id: { $in: this.users } },
              { $addToSet: { farms: this._id } }
          );
          await Equipment.updateMany(
              { _id: { $in: this.equipments } },
              { $set: { farm: this._id } }
          );
          await Device.updateMany(
              { _id: { $in: this.devices } },
              { $set: { farm: this._id } }
          );
      }
      next();
  } catch (err) {
      next(err);
  }
});

export default mongoose.model("Farm", farmSchema);
