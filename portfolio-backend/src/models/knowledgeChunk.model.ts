import { Schema, model, type Document } from 'mongoose';

export type KnowledgeSourceType =
  | 'project'
  | 'profile'
  | 'skills'
  | 'skill'
  | 'services'
  | 'service'
  | 'experience'
  | 'education'
  | 'faq'
  | 'dsa'
  | 'contact';

export interface IKnowledgeChunkMetadata {
  category?: string;
  projectSlug?: string;
  url?: string;
  links?: Record<string, string>;
  technologies?: string[];
  role?: string;
  timeline?: string;
  featured?: boolean;
  [key: string]: unknown;
}

export interface IKnowledgeChunk extends Document {
  chunkId: string;
  source: string;
  sourceType: KnowledgeSourceType;
  projectSlug?: string;
  url?: string;
  title: string;
  content: string;
  metadata: IKnowledgeChunkMetadata;
  tags: string[];
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    chunkId: {
      type: String,
      required: [true, 'chunkId is required'],
      unique: true,
      trim: true,
      index: true
    },
    source: {
      type: String,
      required: [true, 'source path is required'],
      trim: true
    },
    sourceType: {
      type: String,
      required: [true, 'sourceType is required'],
      enum: [
        'project',
        'profile',
        'skills',
        'skill',
        'services',
        'service',
        'experience',
        'education',
        'faq',
        'dsa',
        'contact'
      ],
      index: true
    },
    projectSlug: {
      type: String,
      trim: true,
      index: true
    },
    url: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'content is required'],
      trim: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({})
    },
    tags: {
      type: [String],
      default: []
    },
    embedding: {
      type: [Number],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound index for quick source lookups
knowledgeChunkSchema.index({ sourceType: 1, source: 1 });
knowledgeChunkSchema.index({ projectSlug: 1 });

export const KnowledgeChunk = model<IKnowledgeChunk>('KnowledgeChunk', knowledgeChunkSchema);
