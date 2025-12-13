export class ImageUtils {
  static compress(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          // Set fixed thumbnail size
          const targetMaxWidth = 150;
          const targetMaxHeight = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > targetMaxWidth) {
              height *= targetMaxWidth / width;
              width = targetMaxWidth;
            }
          } else {
            if (height > targetMaxHeight) {
              width *= targetMaxHeight / height;
              height = targetMaxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };

        img.onerror = (err) => reject(err);
      };

      reader.onerror = (err) => reject(err);
    });
  }
}
