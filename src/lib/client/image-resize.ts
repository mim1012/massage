export type ResizeImageMode = 'cover' | 'contain';

export type ResizeImageOptions = {
  width: number;
  height: number;
  mode?: ResizeImageMode;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  background?: string;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러오지 못했습니다.'));
    };
    image.src = url;
  });
}

export async function resizeImageFileToDataUrl(file: File, options: ResizeImageOptions) {
  const {
    width,
    height,
    mode = 'cover',
    mimeType = 'image/jpeg',
    quality = 0.86,
    background = '#ffffff',
  } = options;
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지 리사이징을 지원하지 않는 브라우저입니다.');
  }

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;

  if (mode === 'cover') {
    const cropWidth = sourceRatio > targetRatio ? image.naturalHeight * targetRatio : image.naturalWidth;
    const cropHeight = sourceRatio > targetRatio ? image.naturalHeight : image.naturalWidth / targetRatio;
    const cropX = (image.naturalWidth - cropWidth) / 2;
    const cropY = (image.naturalHeight - cropHeight) / 2;
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
  } else {
    const drawWidth = sourceRatio > targetRatio ? width : height * sourceRatio;
    const drawHeight = sourceRatio > targetRatio ? width / sourceRatio : height;
    const drawX = (width - drawWidth) / 2;
    const drawY = (height - drawHeight) / 2;
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  return canvas.toDataURL(mimeType, quality);
}
