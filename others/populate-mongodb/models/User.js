import mongoose from 'mongoose';
import bcrypt from "bcryptjs";

const Schema = mongoose.Schema;
const SALT_WORK_FACTOR = 10;

const userSchema = new Schema({
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
        enum: ["Administrador", "Veterinario", "Ganadero"],
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
            user.passwordHash = hash;  // sobrescribe el password escrito con el “hasheado”
            next();
        });
    });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.passwordHash, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

// Remove pre hooks that cause circular references for populate script

export default mongoose.model('User', userSchema);