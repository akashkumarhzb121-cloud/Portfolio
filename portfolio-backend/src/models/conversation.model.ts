import { Schema, model, type Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  conversationId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [4000, 'Content exceeds maximum allowed length']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    messages: {
      type: [chatMessageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Auto-expire conversations inactive for 24 hours (86400 seconds)
conversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
