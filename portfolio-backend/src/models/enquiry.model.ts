import { Schema, model, type Document } from 'mongoose';

export interface IContactEnquiry extends Document {
  name: string;
  email: string;
  service: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactEnquirySchema = new Schema<IContactEnquiry>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [255, 'Email cannot exceed 255 characters']
    },
    service: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
      maxlength: [100, 'Service cannot exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for sorting enquiries by date
contactEnquirySchema.index({ createdAt: -1 });

export const ContactEnquiry = model<IContactEnquiry>('ContactEnquiry', contactEnquirySchema);
