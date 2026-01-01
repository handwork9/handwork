import apiClient from './apiClient';

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

interface MultipleUploadResponse {
  urls: string[];
  count: number;
}

// Backend wraps responses in { success: boolean, data: T }
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Retry configuration for uploads
const UPLOAD_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
};

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadService = {
  /**
   * Upload a single base64 encoded image with retry logic
   */
  async uploadImage(
    base64: string,
    folder: string = 'products'
  ): Promise<{ success: boolean; data?: UploadResponse; error?: string }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= UPLOAD_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`[UploadService] Uploading image to folder: ${folder} (attempt ${attempt}/${UPLOAD_RETRY_CONFIG.maxRetries})`);
        const response = await apiClient.post<ApiResponse<UploadResponse>>('/uploads/image', {
          base64,
          folder,
        }, {
          timeout: 60000, // 60 second timeout for uploads
        });
        console.log('[UploadService] Upload response:', JSON.stringify(response.data, null, 2));
        return { success: true, data: response.data };
      } catch (error: any) {
        lastError = error;
        console.error(`[UploadService] Upload attempt ${attempt} failed:`, error.message || error);
        
        // Only retry on 502, 503, 504 or network errors
        const status = error.response?.status;
        const isRetryable = !status || status === 502 || status === 503 || status === 504;
        
        if (isRetryable && attempt < UPLOAD_RETRY_CONFIG.maxRetries) {
          const delayMs = UPLOAD_RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1);
          console.log(`[UploadService] Retrying in ${delayMs}ms...`);
          await delay(delayMs);
        } else {
          break;
        }
      }
    }
    
    return { 
      success: false, 
      error: lastError?.response?.data?.message || lastError?.message || 'Failed to upload image' 
    };
  },

  /**
   * Upload multiple base64 encoded images with retry logic
   */
  async uploadImages(
    images: string[],
    folder: string = 'products'
  ): Promise<{ success: boolean; data?: MultipleUploadResponse; error?: string }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= UPLOAD_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`[UploadService] Uploading ${images.length} images to folder: ${folder} (attempt ${attempt}/${UPLOAD_RETRY_CONFIG.maxRetries})`);
        const response = await apiClient.post<ApiResponse<MultipleUploadResponse>>('/uploads/images', {
          images,
          folder,
        }, {
          timeout: 120000, // 2 minute timeout for multiple uploads
        });
        return { success: true, data: response.data };
      } catch (error: any) {
        lastError = error;
        console.error(`[UploadService] Upload multiple attempt ${attempt} failed:`, error.message || error);
        
        // Only retry on 502, 503, 504 or network errors
        const status = error.response?.status;
        const isRetryable = !status || status === 502 || status === 503 || status === 504;
        
        if (isRetryable && attempt < UPLOAD_RETRY_CONFIG.maxRetries) {
          const delayMs = UPLOAD_RETRY_CONFIG.initialDelay * Math.pow(2, attempt - 1);
          console.log(`[UploadService] Retrying in ${delayMs}ms...`);
          await delay(delayMs);
        } else {
          break;
        }
      }
    }
    
    return { 
      success: false, 
      error: lastError?.response?.data?.message || lastError?.message || 'Failed to upload images' 
    };
  },

  /**
   * Process images - upload base64 images and keep existing URLs
   * Returns array of URLs ready to be saved to product
   */
  async processProductImages(images: string[]): Promise<{ urls: string[]; errors: string[] }> {
    const urls: string[] = [];
    const errors: string[] = [];
    
    // Separate base64 images from existing URLs
    const base64Images: string[] = [];
    
    for (const image of images) {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        // Already a URL, keep it
        urls.push(image);
      } else if (image.startsWith('data:')) {
        // Base64 image, needs upload
        base64Images.push(image);
      }
      // Skip file:// paths as they won't work on server
    }

    // Upload base64 images if any
    if (base64Images.length > 0) {
      const result = await this.uploadImages(base64Images, 'products');
      if (result.success && result.data) {
        urls.push(...result.data.urls);
      } else {
        errors.push(result.error || 'Failed to upload some images');
      }
    }

    return { urls, errors };
  },
};

export default uploadService;
