"use client";

import { IntegrationLogo } from "@/ui/integrations/integration-logo";
import {
  BlurImage,
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { memo, useCallback, useEffect, useState } from "react";
import { IntegrationsWithInstallations } from "./integrations-list";

const FEATURED_SLUGS = ["make", "zapier", "stripe", "shopify"];

export function FeaturedIntegrations({
  integrations,
}: {
  integrations: IntegrationsWithInstallations;
}) {
  const featuredIntegrations = integrations.filter(
    (i) =>
      FEATURED_SLUGS.includes(i.slug) &&
      Array.isArray(i.screenshots) &&
      i.screenshots.length,
  );

  return (
    <div>
      <Carousel
        autoplay={{ delay: 5000 }}
        opts={{ loop: true }}
        className="bg-white"
      >
        <div className="[mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <CarouselContent>
            {featuredIntegrations.map((integration, idx) => (
              <CarouselItem key={idx} className="basis-2/3">
                <div className="relative">
                  {/* Image */}
                  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    <BlurImage
                      src={integration.screenshots![0]}
                      alt={`Screenshot of ${integration.name}`}
                      width={900}
                      height={580}
                      className="aspect-[900/580] w-full overflow-hidden rounded-xl object-cover object-top [mask-image:linear-gradient(black_90%,transparent)]"
                    />
                  </div>

                  {/* Category badge */}
                  <div className="absolute left-4 top-4 rounded bg-white px-2 py-1 text-[0.625rem] font-semibold uppercase text-neutral-800 shadow-[0_2px_2px_0_#00000014]">
                    {integration.category}
                  </div>

                  {/* Bottom card */}
                  <div className="absolute inset-x-4 bottom-4 flex items-start gap-4 rounded-lg bg-white p-2">
                    <div className="shrink-0">
                      <IntegrationLogo
                        src={integration.logo}
                        alt={`Logo for ${integration.name}`}
                        className="size-10"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-neutral-900">
                        {integration.name}
                      </span>
                      <p className="text-sm font-medium text-neutral-700">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
        <CarouselNavBar featuredIntegrations={featuredIntegrations} />
      </Carousel>
    </div>
  );
}

function CarouselNavBar({
  featuredIntegrations,
}: {
  featuredIntegrations: IntegrationsWithInstallations;
}) {
  const { scrollNext, scrollPrev, canScrollNext, canScrollPrev, api } =
    useCarousel();

  const autoplay = api?.plugins()?.autoplay;

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback((api: CarouselApi) => {
    setSelectedIndex(api?.selectedScrollSnap() ?? 0);
  }, []);

  const stopAutoplayAnd = useCallback(
    (fn: () => void) => () => {
      if (autoplay && autoplay.isPlaying()) autoplay.stop();
      fn();
    },
    [autoplay],
  );

  useEffect(() => {
    if (!api) return;

    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
  }, [api, autoplay, onSelect]);

  return (
    <div className="relative mt-6 flex items-center justify-center gap-4 pb-1">
      {api != null && (
        <>
          {api.slideNodes().map((_, idx) => {
            const integration = featuredIntegrations[idx];

            return (
              <button
                key={idx}
                onClick={stopAutoplayAnd(() => api.scrollTo(idx))}
                className={cn(
                  "rounded-md ring-black/10 transition-all duration-100 hover:scale-105 active:scale-100",
                  idx === selectedIndex && "ring-[3px]",
                )}
              >
                <IntegrationLogo
                  src={integration.logo}
                  alt={`Logo for ${integration.name}`}
                />
                <span className="sr-only">Slide {idx + 1}</span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

const BlurImageMemo = memo(BlurImage);
