import { IMAGE_PICKER_DEFAULTS } from "../components/common/form/image-picker/image-picker.types";
import { SurveyImage } from "../types/framework.types";
import { SupabaseClientService } from "./supabase-client.service";

export interface ImageUploadResult {
  success: boolean;
  image?: SurveyImage;
  error?: string;
}

export interface ImageUploadOptions {
  configId: string;
  entityType: "field" | "option" | "section" | "subsection";
  entityId: string;
  altText?: string;
  caption?: string;
  isPrimary?: boolean;
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = IMAGE_PICKER_DEFAULTS.MAX_FILE_SIZE;
  private static readonly ALLOWED_TYPES = [
    ...IMAGE_PICKER_DEFAULTS.ALLOWED_TYPES,
  ];

  static async uploadImages(
    files: File[],
    options: ImageUploadOptions
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadSingleImage(file, {
        ...options,
        isPrimary: options.isPrimary && i === 0, // Only first image can be primary
      });
      results.push(result);
    }

    return results;
  }

  static async uploadSingleImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<ImageUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Get Supabase client
      const supabaseService = SupabaseClientService.getInstance();
      const client = supabaseService.getCurrentClient();

      // Handle missing configId for new surveys
      if (!options.configId || options.configId.trim() === "") {
        return {
          success: false,
          error:
            "Please save the survey before uploading images. Images can only be added to saved surveys.",
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split(".").pop();
      const uniqueFilename = `${timestamp}_${randomSuffix}.${fileExtension}`;

      // Create storage path
      const storagePath = `${options.configId}/${options.entityType}/${options.entityId}/${uniqueFilename}`;

      // Get reliable MIME type from file extension (fallback to file.type if needed)
      const detectedMimeType =
        this.getMimeTypeFromExtension(file.name) || file.type;

      // Debug logging
      console.log("Image upload debug:", {
        fileName: file.name,
        fileType: file.type,
        detectedMimeType,
        fileSize: file.size,
        storagePath,
      });

      // Create a temporary client without global headers for file uploads
      const { createClient } = await import("@supabase/supabase-js");
      const uploadClient = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!,
        {
          auth: {
            storageKey: "sb-auth-token",
            persistSession: true,
            autoRefreshToken: true,
          },
        }
      );

      // Use the temporary client for file upload
      const { error: uploadError } = await uploadClient.storage
        .from("survey-images")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: detectedMimeType,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`,
        };
      }

      // Get public URL using the original client (public URL doesn't need special headers)
      const { data: urlData } = client.storage
        .from("survey-images")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        return { success: false, error: "Failed to get public URL" };
      }

      // Get image dimensions if possible
      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith("image/")) {
        try {
          const dimensions = await this.getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        } catch (error) {
          // Dimensions are optional, don't fail upload for this
          console.warn("Could not get image dimensions:", error);
        }
      }

      // Create database record with snake_case field names
      const surveyImageDb = {
        filename: uniqueFilename,
        original_filename: file.name,
        file_size: file.size,
        mime_type: detectedMimeType,
        storage_path: storagePath,
        storage_url: urlData.publicUrl,
        width,
        height,
        alt_text: options.altText || "",
        caption: options.caption || "",
        entity_type: options.entityType,
        entity_id: options.entityId,
        config_id: options.configId,
        display_order: 0,
        is_primary: options.isPrimary || false,
        is_active: true,
        upload_status: "completed",
        uploaded_by: "current_user",
        metadata: {},
      };

      // Save to database
      const { data: dbData, error: dbError } = await client
        .from("survey_images")
        .insert(surveyImageDb)
        .select()
        .single();

      if (dbError) {
        // Clean up storage if database insert fails
        await client.storage.from("survey-images").remove([storagePath]);
        console.error("Database insert error:", dbError);
        return { success: false, error: `Database error: ${dbError.message}` };
      }

      const completeImage: SurveyImage = {
        ...dbData,
        createdAt: dbData.created_at,
        updatedAt: dbData.updated_at,
      };

      return { success: true, image: completeImage };
    } catch (error) {
      console.error("Upload service error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  static async deleteImage(imageId: string): Promise<boolean> {
    try {
      // Get Supabase client
      const supabaseService = SupabaseClientService.getInstance();
      const client = supabaseService.getCurrentClient();

      // Get image record to find storage path
      const { data: imageData, error: fetchError } = await client
        .from("survey_images")
        .select("storage_path")
        .eq("id", imageId)
        .single();

      if (fetchError) {
        console.error("Error fetching image record:", fetchError);
        return false;
      }

      // Delete from storage
      const { error: storageError } = await client.storage
        .from("survey-images")
        .remove([imageData.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await client
        .from("survey_images")
        .delete()
        .eq("id", imageId);

      if (dbError) {
        console.error("Database delete error:", dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Delete service error:", error);
      return false;
    }
  }

  static async getImages(
    configId: string,
    entityType?: string,
    entityId?: string
  ): Promise<SurveyImage[]> {
    try {
      // Get Supabase client
      const supabaseService = SupabaseClientService.getInstance();
      const client = supabaseService.getCurrentClient();

      // Build query
      let query = client
        .from("survey_images")
        .select("*")
        .eq("config_id", configId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      // Add optional filters
      if (entityType) {
        query = query.eq("entity_type", entityType);
      }
      if (entityId) {
        query = query.eq("entity_id", entityId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database query error:", error);
        return [];
      }

      // Convert database format to SurveyImage format
      return (data || []).map(
        (record): SurveyImage => ({
          id: record.id,
          filename: record.filename,
          originalFilename: record.original_filename,
          fileSize: record.file_size,
          mimeType: record.mime_type,
          storagePath: record.storage_path,
          storageUrl: record.storage_url,
          width: record.width,
          height: record.height,
          altText: record.alt_text || "",
          caption: record.caption || "",
          entityType: record.entity_type,
          entityId: record.entity_id,
          configId: record.config_id,
          displayOrder: record.display_order,
          isPrimary: record.is_primary,
          isActive: record.is_active,
          uploadStatus: record.upload_status,
          uploadedBy: record.uploaded_by,
          metadata: record.metadata || {},
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        })
      );
    } catch (error) {
      console.error("Get images service error:", error);
      return [];
    }
  }

  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: "File type not supported. Please use JPEG, PNG, GIF, or WebP.",
      };
    }

    return { valid: true };
  }

  private static getMimeTypeFromExtension(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      default:
        return "image/jpeg"; // Default fallback
    }
  }

  private static getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}
