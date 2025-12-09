import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RuleResult } from '../core/rules/lib';

export type UrlAnalysisDocument = UrlAnalysis & Document;

export enum AnalysisStatus {
  PENDING = 'pending',
  FETCHING = 'fetching',
  ONGOING = 'ongoing',
  FINISHED = 'finished',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class UrlAnalysis {
  @Prop({ required: true })
  url: string;

  @Prop({
    required: true,
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  status: AnalysisStatus;

  @Prop({ type: Object })
  results?: Record<string, RuleResult>;

  @Prop()
  errorMessage?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UrlAnalysisSchema = SchemaFactory.createForClass(UrlAnalysis);
