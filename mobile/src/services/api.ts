import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import type { CheckpointResponse } from '../types/checkpoint';

export const fetchCheckpoints = async (params?: {
  state?: string;
  city?: string;
  county?: string;
  upcoming?: boolean;
}): Promise<CheckpointResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.state) queryParams.append('state', params.state);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.county) queryParams.append('county', params.county);
    if (params?.upcoming) queryParams.append('upcoming', 'true');

    const url = `${API_BASE_URL}/api/dui-checkpoints${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await axios.get<CheckpointResponse>(url, {
      timeout: 10000, // 10 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch checkpoints: ${error.message}`);
    }
    throw error;
  }
};

