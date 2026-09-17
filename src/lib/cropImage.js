// Canvas-based crop export for react-easy-crop — takes the pixel-space crop rect it reports via
// onCropComplete and rasterizes just that region of the source image into a new File, ready to
// hand to uploadFile() exactly like any other picked photo.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export async function getCroppedImageFile(imageSrc, croppedAreaPixels, fileName = 'category.jpg') {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.92);
  });

  return new File([blob], fileName, { type: 'image/jpeg' });
}
