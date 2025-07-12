/**
 * Modelo de Notification - Gestión de notificaciones del sistema
 * Maneja notificaciones para usuarios con seguimiento de lectura
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Esquema de Notification
 * Define la estructura de datos para las notificaciones del sistema
 */
var notificationSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true
    },
    type: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    read: [
        {
            userId: { 
                type: Schema.Types.ObjectId, 
                ref: 'User' 
            },
            read: { 
                type: Boolean, 
                default: false 
            },
            readDate: { 
                type: Date 
            }
        }
    ],
    farm: { 
        type: Schema.Types.ObjectId, 
        ref: 'Farm' 
    },
    equipment: { 
        type: Schema.Types.ObjectId, 
        ref: 'Equipment' 
    },
    device: { 
        type: Schema.Types.ObjectId, 
        ref: 'Device' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Notification', notificationSchema);