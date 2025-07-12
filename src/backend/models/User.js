/**
 * Modelo de Usuario - Gestión de usuarios del sistema
 * Incluye autenticación, roles y relaciones con granjas
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require("bcryptjs"); //Para la encriptación del password
var SALT_WORK_FACTOR = 10;
const Farm = require('../models/Farm');

/**
 * Esquema de Usuario
 * Define la estructura de datos para los usuarios del sistema
 */
var userSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true
    },
    name: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["Administrador", "Veterinario", "Industria", "Ganadero"],
        required: true
    },
    farms: [{
        type: Schema.Types.ObjectId,
        ref: 'Farm',
        validate: {
            validator: function(v) {
                return this.role !== "Administrador" || v.length === 0;
            },
            message: "El administrador no puede tener granjas asociadas."
        }
    }],
});

/**
 * Hook pre-save para encriptar la contraseña
 * Se ejecuta automáticamente antes de guardar el usuario
 */
userSchema.pre("save", function (next) {
    var user = this;
    // solo aplica una función hash al password si ha sido modificado (o es nuevo)
    if (!user.isModified("passwordHash")) return next();
    // genera la salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);
        // aplica una función hash al password usando la nueva salt
        bcrypt.hash(user.passwordHash, salt, function (err, hash) {
            if (err) return next(err);
            user.passwordHash = hash;  // sobrescribe el password escrito con el "hasheado"
            next();
        });
    });
});

/**
 * Método para comparar contraseñas
 * Utilizado durante el proceso de autenticación
 */
userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.passwordHash, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

/**
 * Hook pre-save para sincronizar relaciones con granjas
 * Mantiene las referencias bidireccionales entre usuarios y granjas
 */
userSchema.pre('save', async function(next) {
    try {
        if (this.isModified('farms')) {
            
            // Eliminar referencias antiguas
            const oldUser = await this.constructor.findById(this._id);
            if (oldUser) {
                await mongoose.model('Farm').updateMany(
                    { users: oldUser._id },
                    { $pull: { users: oldUser._id } }
                );
            }

            // Agregar nuevas referencias
            await mongoose.model('Farm').updateMany(
                { _id: { $in: this.farms } },
                { $addToSet: { users: this._id } }
            );
        }
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * Hook pre-remove para limpiar referencias al eliminar usuario
 * Se ejecuta antes de eliminar un usuario para limpiar referencias en granjas
 */
userSchema.pre(['remove', 'deleteOne', 'findOneAndDelete', 'findByIdAndDelete'], async function(next) {
    try {
        // Para métodos estáticos, necesitamos acceder al _id de manera diferente
        const userId = this.getQuery ? this.getQuery()._id : this._id;
        
        await mongoose.model('Farm').updateMany(
            { users: userId },
            { $pull: { users: userId } }
        );
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema);