"use client";

import { cn } from "@dub/utils";
import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

export function BlurImage(props: Omit<ImageProps, "width" | "height">) {
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState(props.src);
  useEffect(() => setSrc(props.src), [props.src]); // update the `src` value when the `prop.src` value changes

  const handleLoad = (e) => {
    setLoading(false);
    const target = e.target as HTMLImageElement;
    if (target.naturalWidth < 20 && target.naturalHeight < 20) {
      setSrc(`https://avatar.vercel.sh/${props.alt}`);
    }
  };

  return (
    <Image
      {...props}
      src={src}
      alt={props.alt}
      className={cn(loading ? "blur-[2px]" : "blur-0", props.className)}
      onLoad={handleLoad}
      onError={() => {
        setSrc(`https://avatar.vercel.sh/${props.alt}`); // if the image fails to load, use the default avatar
      }}
      unoptimized
    />
  );
}
