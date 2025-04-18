import { useCallback } from 'react';

interface CropRegion {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface UseCropImageProps {
  imageRef: React.RefObject<HTMLImageElement>;
  cropRegion: CropRegion;
  displayName?: string;
}

interface CroppedImageResult {
  blob: Blob | null;
  url: string | null;
  width: number;
  height: number;
}

export const useCropImage = ({
  imageRef,
  cropRegion,
  displayName = 'cropped_image',
}: UseCropImageProps) => {
  const calculateScalingFactor = useCallback(() => {
    if (!imageRef.current) return 1;
    const { naturalWidth, naturalHeight } = imageRef.current;
    const { clientWidth, clientHeight } = imageRef.current;
    return Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
  }, []);

  const getCroppedImage = useCallback(async (): Promise<CroppedImageResult> => {
    if (!imageRef.current) {
      return { blob: null, url: null, width: 0, height: 0 };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { blob: null, url: null, width: 0, height: 0 };
    }

    const scalingFactor = calculateScalingFactor();

    // 设置画布尺寸为裁剪区域大小
    const width =
      (imageRef.current.clientWidth - cropRegion.left - cropRegion.right) / scalingFactor;
    const height =
      (imageRef.current.clientHeight - cropRegion.top - cropRegion.bottom) / scalingFactor;
    canvas.width = width;
    canvas.height = height;

    // 绘制裁剪后的图片
    ctx.drawImage(
      imageRef.current,
      cropRegion.left / scalingFactor,
      cropRegion.top / scalingFactor,
      width,
      height,
      0,
      0,
      width,
      height
    );

    return new Promise<CroppedImageResult>(resolve => {
      canvas.toBlob(blob => {
        if (!blob) {
          resolve({ blob: null, url: null, width, height });
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve({ blob, url, width, height });
      }, 'image/png');
    });
  }, [
    calculateScalingFactor,
    cropRegion.bottom,
    cropRegion.left,
    cropRegion.right,
    cropRegion.top,
  ]);

  const exportCroppedImage = useCallback(async () => {
    const { blob, url } = await getCroppedImage();
    if (!blob || !url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getCroppedImage, displayName]);

  return {
    getCroppedImage,
    exportCroppedImage,
  };
};
