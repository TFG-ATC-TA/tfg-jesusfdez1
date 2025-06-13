import mongoose from "mongoose";
const Schema = mongoose.Schema;

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

// Remove pre hooks that cause circular references for populate script

export default mongoose.model("Device", deviceSchema);