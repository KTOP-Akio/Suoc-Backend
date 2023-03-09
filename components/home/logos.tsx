import BlurImage from "../shared/blur-image";
import MaxWidthWrapper from "../shared/max-width-wrapper";

export default function Logos() {
  return (
    <div className="mt-20">
      <p className="text-center text-lg text-gray-600">
        Giving superpowers to marketing teams at world-class companies
      </p>
      <div className="mx-auto mt-8 grid w-full max-w-screen-lg grid-cols-2 items-center gap-5 px-5 sm:grid-cols-6 sm:px-0">
        <BlurImage
          src="/_static/clients/vercel.svg"
          alt="Vercel"
          width={2418}
          height={512}
          className="col-span-1 h-5 sm:h-7"
        />
        <BlurImage
          src="/_static/clients/tinybird.svg"
          alt="Tinybird"
          width={2418}
          height={512}
          className="col-span-1 h-7 sm:h-10"
        />
        <BlurImage
          src="/_static/clients/checkly.svg"
          alt="Checkly"
          width={2418}
          height={512}
          className="col-span-1 h-6 sm:h-8"
        />
        <BlurImage
          src="/_static/clients/cal.svg"
          alt="Cal.com"
          width={2418}
          height={512}
          className="col-span-1 h-4 sm:h-6"
        />
        <BlurImage
          src="/_static/clients/crowdin.svg"
          alt="Crowdin"
          width={2418}
          height={512}
          className="col-span-1 h-6 sm:h-8"
        />
        <BlurImage
          src="/_static/clients/lugg.svg"
          alt="Lugg"
          width={2418}
          height={512}
          className="col-span-1 h-14 sm:h-20"
        />
      </div>
    </div>
  );
}
