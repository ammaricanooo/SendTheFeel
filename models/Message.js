import mongoose from "mongoose";

function generateRandomSlug(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let slug = '';
    for (let i = 0; i < length; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
}

const messageSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    sender: {
        type: String,
        required: true,
    },
    recipient: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    song: {
        type: Object,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

messageSchema.pre('validate', async function (next) {
    if (!this.slug) {
        let slug;
        let exists = true;
        while (exists) {
            slug = generateRandomSlug(8);
            exists = await mongoose.models.Message.findOne({ slug });
        }
        this.slug = slug;
    }
    next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
