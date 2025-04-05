import mongoose from 'mongoose';

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
        }]
    },
    { timestamps: true }
);

// Add index for username search
userSchema.index({ username: 'text' });

const User = mongoose.model("User", userSchema)

export default User;