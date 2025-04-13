import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            minLenght: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        friendRequests: [{
            from: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        //otp verification code start here
        otp: {
            type: String,
        },
        otp_expiation: {
            type: Date,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});


// Add index for username search
userSchema.index({ username: 'text' });

const User = mongoose.model("User", userSchema)

export default User;