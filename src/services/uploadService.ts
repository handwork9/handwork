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

export const uploadService = {
  /**
   * Upload a single base64 encoded image
   */
  async uploadImage(
    base64: string,
    folder: string = 'products'
  ): Promise<{ success: boolean; data?: UploadResponse; error?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<UploadResponse>>('/uploads/image', {
        base64,
        folder,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Upload image error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to upload image' 
      };
    }
  },

  /**
   * Upload multiple base64 encoded images
   */
  async uploadImages(
    images: string[],
    folder: string = 'products'
  ): Promise<{ success: boolean; data?: MultipleUploadResponse; error?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<MultipleUploadResponse>>('/uploads/images', {
        images,
        folder,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Upload images error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to upload images' 
      };
    }
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
