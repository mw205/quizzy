export class ImagesService {
  static async uploadImage(file) {
    const CLOUDINARY_URL =
      "https://api.cloudinary.com/v1_1/dhmactdgq/image/upload";
    const CLOUDINARY_UPLOAD_PRESET = "quizzy";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Image upload failed: ${errorData.error.message}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to Image host:", error);
      throw error;
    }
  }
}
