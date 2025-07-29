const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const stateSchema = new Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm formato 24 horas
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:mm formato 24 horas
  },
  state: {
    type: String,
    enum: ["MAINTENANCE", "EMPTY TANK", "CLEANING", "COOLING", "MILKING"], // Agrega más estados según necesites
    required: true,
  }
});

const tankStateSchema = new Schema({
  farmId: {
    type: String,
    required: true,
  },
  tankId: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  states: {
    type: [stateSchema],
    validate: {
      validator: function (states) {
        return states.length > 0;
      },
      message: "Debe haber al menos un estado",
    },
  }
});

// Índices para consultas eficientes
tankStateSchema.index({ farmId: 1, tankId: 1, date: 1 });

module.exports = model("TankState", tankStateSchema);
