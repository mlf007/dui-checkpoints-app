export interface Checkpoint {
  id: string;
  State: string;
  County: string | null;
  City: string | null;
  Location: string;
  Description: string;
  Date: string;
  Time: string;
  Source: string;
  created_at: string;
  mapurl?: string | null;
}

export interface CheckpointResponse {
  success: boolean;
  count: number;
  checkpoints: Checkpoint[];
}

export interface CheckpointError {
  error: string;
  details?: string;
}

