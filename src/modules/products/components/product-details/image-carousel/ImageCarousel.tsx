import clsx from "clsx";
import { useState } from "react";

interface OptimizedImageData {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  sizes?: string;
}

export interface OptimizedCarouselImage {
  originalUrl: string;
  main: OptimizedImageData;
  thumb: OptimizedImageData;
}

interface Props {
  images: OptimizedCarouselImage[];
  alt: string;
}

export const ImageCarousel = ({ images, alt }: Props) => {
  if (images.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const currentImage = images[currentIndex];

  const handlePreview = () => setIsPreviewing(true);
  const handleClosePreview = () => setIsPreviewing(false);
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) =>
    event.stopPropagation();

  const renderOptimizedImg = (
    data: OptimizedImageData,
    extraProps?: React.ImgHTMLAttributes<HTMLImageElement>,
  ) => (
    <img
      src={data.src}
      srcSet={data.srcSet}
      sizes={data.sizes}
      width={data.width}
      height={data.height}
      alt={alt}
      loading={extraProps?.loading ?? "lazy"}
      decoding="async"
      draggable={false}
      {...extraProps}
    />
  );

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-all duration-200",
          {
            "opacity-0 pointer-events-none": !isPreviewing,
            "opacity-100": isPreviewing,
          },
        )}
        onClick={handleClosePreview}
      >
        {renderOptimizedImg(currentImage.main, {
          className: "object-contain max-w-3xl",
          onClick: handleImageClick,
        })}
      </div>

      <div className="flex flex-col gap-4">
        {renderOptimizedImg(currentImage.main, {
          className: "w-full object-cover cursor-pointer",
          onClick: handlePreview,
          loading: "eager",
        })}

        <div className="flex gap-2 justify-center">
          {images.map((image, index) => (
            <button
              key={image.originalUrl}
              onClick={() => setCurrentIndex(index)}
              className="cursor-pointer"
            >
              {renderOptimizedImg(image.thumb, {
                className: clsx(
                  "aspect-square object-cover ease-in-out duration-200",
                  {
                    "shadow-md": currentIndex === index,
                  },
                ),
              })}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
