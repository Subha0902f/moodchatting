import { supabaseAdmin as supabase } from "../config/supabase";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['private', 'group'],
      default: 'private',
    },
    name: {
      type: String,
      // Required if type is 'group', otherwise optional
      required: function () {
        return this.type === 'group';
      },
      trim: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ participants: 1 }); // Index for efficient lookup by participants

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;