export type ScanningStatus = 'idle' | 'scanning' | 'paused' | 'stopped';

export type SystemStatus = 'ONLINE' | 'ANALYZING' | 'PAUSED' | 'OFFLINE';

export interface ObjectAnchor {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DetectedObject {
  name: string;
  description: string;
  inferredPurpose?: string;
  isInferred?: boolean;
  anchor?: ObjectAnchor;
  labelSide?: 'left' | 'right' | 'top' | 'bottom';
}

/** Floating HUD callout — AI says where to put the description div. */
export interface OverlayCallout {
  title: string;
  detail: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export interface ObjectIntelligenceItem {
  name: string;
  facts: string;
  inferences?: string;
}

export interface TextRecognition {
  text: string[];
  status: string;
}

export interface VisionAnalysis {
  sceneSummary: string;
  mainActivity?: string;
  objects: DetectedObject[];
  overlays?: OverlayCallout[];
  objectIntelligence: ObjectIntelligenceItem[];
  textRecognition: TextRecognition;
  spatialObservations: string[];
  insights: string[];
  limitations: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  analyzedAt: string;
  model: string;
  durationMs: number;
  analysis: VisionAnalysis;
}

export interface AskResponse {
  success: boolean;
  askedAt: string;
  model: string;
  durationMs: number;
  question: string;
  answer: string;
  groundedInImage: boolean;
  limitations: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
  aiConfigured: boolean;
  model: string;
  timestamp: string;
}

export interface ApiErrorBody {
  error: string;
  code?: string;
}

export interface CapturedFrame {
  uri: string;
  capturedAt: number;
  requestId: number;
  /** Prepared upload frame size — used to map LLM coords onto the live preview. */
  width: number;
  height: number;
}
