import { cn } from "@dub/utils";
import { RESOURCES } from "../../content";
import { ContentProps, createHref } from "../shared";
import {
  ContentLinkCard,
  ToolLinkCard,
  contentHeadingClassName,
} from "./shared";

export function ResourcesContent({ domain }: ContentProps) {
  return (
    <div className="grid w-[32rem] grid-cols-12">
      <div className="col-span-7 p-5">
        <p className={cn(contentHeadingClassName, "mb-2")}>Tools</p>
        <div className="flex flex-col gap-2">
          <ToolLinkCard
            name="Spotify Link Shortener"
            href={createHref("/tools/spotify-link-shortener", domain)}
            icon={
              <svg
                className="h-full w-full"
                viewBox="0 0 222 222"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M110.999 0C49.6974 0 0 49.6973 0 111.001C0 172.307 49.6974 222 110.999 222C172.308 222 222 172.307 222 111.001C222 49.7012 172.308 0.00530203 110.998 0.00530203L110.999 0ZM161.903 160.095C159.915 163.356 155.647 164.389 152.386 162.388C126.324 146.469 93.5163 142.863 54.8787 151.691C51.1554 152.539 47.4441 150.207 46.5958 146.482C45.7435 142.757 48.0671 139.046 51.7996 138.197C94.0823 128.537 130.351 132.697 159.61 150.578C162.871 152.579 163.904 156.834 161.903 160.095ZM175.489 129.871C172.984 133.943 167.655 135.228 163.586 132.723C133.75 114.383 88.2687 109.072 52.9779 119.785C48.4011 121.167 43.5671 118.588 42.178 114.019C40.7995 109.442 43.3802 104.617 47.9491 103.225C88.2608 90.9935 138.376 96.9185 172.639 117.974C176.708 120.479 177.994 125.808 175.489 129.872V129.871ZM176.655 98.3977C140.881 77.1485 81.8574 75.1947 47.7012 85.5615C42.2164 87.225 36.4161 84.1286 34.754 78.6437C33.0918 73.1561 36.1855 67.3596 41.6743 65.6922C80.8832 53.7891 146.063 56.0889 187.251 80.5405C192.195 83.4685 193.812 89.8403 190.883 94.7672C187.967 99.7007 181.578 101.327 176.661 98.3977H176.655Z"
                  fill="#1ED760"
                />
                <path
                  d="M161.903 160.095C159.915 163.356 155.647 164.389 152.386 162.388C126.325 146.469 93.5164 142.863 54.8788 151.691C51.1556 152.539 47.4442 150.207 46.5959 146.482C45.7436 142.757 48.0672 139.046 51.7997 138.197C94.0824 128.537 130.351 132.697 159.61 150.578C162.871 152.579 163.905 156.834 161.903 160.095ZM175.489 129.871C172.984 133.943 167.656 135.228 163.586 132.723C133.75 114.383 88.2689 109.072 52.9781 119.785C48.4012 121.167 43.5672 118.588 42.1781 114.019C40.7996 109.442 43.3803 104.617 47.9492 103.225C88.2609 90.9934 138.376 96.9184 172.639 117.974C176.709 120.479 177.994 125.808 175.489 129.872V129.871ZM176.656 98.3977C140.881 77.1485 81.8576 75.1947 47.7014 85.5615C42.2165 87.225 36.4163 84.1286 34.7541 78.6437C33.092 73.1561 36.1856 67.3596 41.6744 65.6921C80.8833 53.7891 146.064 56.0888 187.251 80.5405C192.195 83.4685 193.813 89.8402 190.883 94.7672C187.967 99.7007 181.578 101.327 176.661 98.3977H176.656Z"
                  fill="white"
                />
              </svg>
            }
          />
          <ToolLinkCard
            name="ChatGPT Link Shortener"
            href={createHref("/tools/chatgpt-link-shortener", domain)}
            icon={
              <svg
                className="h-full w-full"
                viewBox="0 0 222 222"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="111" cy="111" r="111" fill="black" />
                <path
                  d="M173.607 97.7454C176.886 87.8002 175.751 76.9142 170.492 67.8719C162.584 54.0098 146.691 46.8792 131.17 50.2298C122.423 40.4311 109.151 36.0738 96.3504 38.7981C83.5497 41.5224 73.1632 50.9148 69.1005 63.4398C58.9049 65.5455 50.1051 71.9745 44.9529 81.0819C36.9593 94.9215 38.7736 112.379 49.4395 124.252C46.1479 134.192 47.2727 145.08 52.5258 154.125C60.4432 167.992 76.3466 175.122 91.8764 171.767C98.784 179.601 108.708 184.058 119.11 183.999C135.02 184.014 149.114 173.67 153.974 158.414C164.168 156.304 172.967 149.876 178.122 140.771C186.019 126.956 184.197 109.593 173.607 97.7454ZM119.11 174.444C112.76 174.454 106.609 172.213 101.735 168.112L102.593 167.623L131.456 150.844C132.917 149.981 133.818 148.406 133.827 146.7V105.717L146.03 112.826C146.152 112.889 146.237 113.006 146.258 113.143V147.103C146.227 162.19 134.091 174.412 119.11 174.444ZM60.756 149.348C57.5714 143.81 56.428 137.318 57.5268 131.015L58.3841 131.533L87.2755 148.312C88.7311 149.172 90.535 149.172 91.9907 148.312L127.283 127.82V142.009C127.277 142.158 127.203 142.296 127.083 142.383L97.849 159.363C84.8581 166.9 68.2607 162.419 60.756 149.348ZM53.1545 86.032C56.3612 80.4583 61.4227 76.207 67.443 74.0308V108.567C67.4209 110.266 68.3188 111.843 69.7863 112.682L104.907 133.087L92.7051 140.196C92.5711 140.267 92.4105 140.267 92.2764 140.196L63.0993 123.244C50.134 115.676 45.6875 98.9734 53.1545 85.8881V86.032ZM153.403 109.488L118.167 88.8812L130.341 81.8013C130.475 81.7297 130.636 81.7297 130.77 81.8013L159.947 98.7815C169.053 104.074 174.307 114.185 173.432 124.737C172.557 135.289 165.712 144.383 155.86 148.082V113.546C155.809 111.851 154.875 110.309 153.403 109.488ZM165.548 91.0973L164.691 90.5792L135.856 73.6566C134.392 72.7912 132.577 72.7912 131.113 73.6566L95.8486 94.1479V79.9594C95.8333 79.8125 95.8991 79.6689 96.02 79.5853L125.197 62.6339C134.326 57.3376 145.672 57.8319 154.312 63.9022C162.953 69.9726 167.331 80.5253 165.548 90.9821V91.0973ZM89.1901 116.251L76.9877 109.171C76.8644 109.096 76.7807 108.969 76.7591 108.826V74.9517C76.773 64.3439 82.8721 54.6994 92.4112 50.201C101.95 45.7026 113.211 47.1605 121.311 53.9424L120.453 54.4316L91.5906 71.2103C90.1293 72.0736 89.2279 73.6485 89.2187 75.3546L89.1901 116.251ZM95.82 101.861L111.537 92.7377L127.283 101.861V120.107L111.595 129.231L95.8486 120.107L95.82 101.861Z"
                  fill="url(#paint0_radial_39_26)"
                />
                <defs>
                  <radialGradient
                    id="paint0_radial_39_26"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(40 38) rotate(45.5947) scale(204.365 204.365)"
                  >
                    <stop stopColor="white" stopOpacity="0.85" />
                    <stop offset="1" stopColor="white" stopOpacity="0.1" />
                  </radialGradient>
                </defs>
              </svg>
            }
          />
          <ToolLinkCard
            name="GitHub Link Shortener"
            href={createHref("/tools/github-link-shortener", domain)}
            icon={
              <svg
                className="h-full w-full"
                viewBox="0 0 222 222"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="111" cy="111" r="111" fill="#0D1117" />
                <path
                  d="M111.001 44C72.8976 44 42 74.7556 42 112.696C42 143.048 61.7708 168.798 89.1868 177.882C92.6352 178.518 93.9013 176.392 93.9013 174.577C93.9013 172.939 93.8373 167.528 93.8076 161.787C74.6115 165.943 70.5609 153.682 70.5609 153.682C67.4222 145.742 62.8997 143.63 62.8997 143.63C56.6393 139.367 63.3716 139.454 63.3716 139.454C70.3004 139.939 73.9488 146.534 73.9488 146.534C80.103 157.036 90.0906 154 94.0281 152.244C94.6474 147.804 96.4356 144.774 98.4089 143.058C83.0829 141.321 66.972 135.431 66.972 109.108C66.972 101.608 69.6674 95.4801 74.0814 90.6693C73.3649 88.939 71.0031 81.952 74.7498 72.4896C74.7498 72.4896 80.544 70.6433 93.7299 79.5312C99.2339 78.0091 105.137 77.2458 111.001 77.2196C116.864 77.2458 122.772 78.0091 128.286 79.5312C141.456 70.6433 147.242 72.4896 147.242 72.4896C150.998 81.952 148.635 88.939 147.919 90.6693C152.343 95.4801 155.02 101.608 155.02 109.108C155.02 135.493 138.878 141.303 123.513 143.004C125.988 145.136 128.194 149.316 128.194 155.725C128.194 164.917 128.114 172.315 128.114 174.577C128.114 176.405 129.356 178.547 132.853 177.873C160.254 168.779 180 143.038 180 112.696C180 74.7556 149.107 44 111.001 44ZM67.843 141.859C67.691 142.201 67.1517 142.303 66.6603 142.069C66.1599 141.844 65.8788 141.379 66.041 141.037C66.1896 140.685 66.73 140.587 67.2294 140.823C67.731 141.047 68.0166 141.517 67.843 141.859ZM71.237 144.874C70.9079 145.178 70.2646 145.037 69.8282 144.557C69.3768 144.078 69.2923 143.438 69.6259 143.129C69.9653 142.826 70.5892 142.968 71.0416 143.447C71.493 143.931 71.5809 144.567 71.237 144.874ZM73.5655 148.732C73.1427 149.024 72.4514 148.75 72.0241 148.139C71.6013 147.529 71.6013 146.796 72.0332 146.502C72.4617 146.209 73.1427 146.473 73.5758 147.079C73.9974 147.7 73.9974 148.433 73.5655 148.732ZM77.5034 153.2C77.1252 153.615 76.3196 153.504 75.73 152.937C75.1267 152.383 74.9588 151.597 75.3381 151.182C75.7209 150.766 76.531 150.883 77.1252 151.445C77.7239 151.998 77.9067 152.789 77.5034 153.2ZM82.5928 154.708C82.4259 155.246 81.6501 155.491 80.8685 155.262C80.0881 155.027 79.5774 154.397 79.7351 153.853C79.8973 153.311 80.6766 153.056 81.4639 153.301C82.2431 153.535 82.755 154.161 82.5928 154.708ZM88.3847 155.348C88.4041 155.915 87.7414 156.384 86.921 156.395C86.096 156.413 85.4287 155.954 85.4196 155.397C85.4196 154.825 86.0674 154.359 86.8924 154.346C87.7128 154.33 88.3847 154.785 88.3847 155.348ZM94.0746 155.131C94.1729 155.684 93.6027 156.251 92.788 156.403C91.987 156.548 91.2455 156.207 91.1438 155.659C91.0444 155.092 91.6248 154.525 92.4247 154.378C93.2405 154.237 93.9706 154.569 94.0746 155.131Z"
                  fill="url(#paint0_radial_39_32)"
                />
                <defs>
                  <radialGradient
                    id="paint0_radial_39_32"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(42 44) rotate(44.1575) scale(192.354 192.312)"
                  >
                    <stop stopColor="white" stopOpacity="0.77" />
                    <stop offset="1" stopColor="white" stopOpacity="0.1" />
                  </radialGradient>
                </defs>
              </svg>
            }
          />
          <ToolLinkCard
            name="Amazon Link Shortener"
            href={createHref("/tools/amazon-link-shortener", domain)}
            icon={
              <svg
                className="h-full w-full"
                viewBox="0 0 222 222"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="111"
                  cy="111"
                  r="111"
                  fill="url(#paint0_linear_39_35)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M167.627 151.288C165.868 148.976 155.967 150.187 151.538 150.74C150.176 150.91 149.967 149.698 151.198 148.825C159.073 143.144 172.023 144.772 173.515 146.687C175.032 148.602 173.137 161.895 165.718 168.236C164.584 169.22 163.503 168.692 164.012 167.402C165.66 163.141 169.406 153.595 167.627 151.288ZM161.889 158.017C148.087 168.43 128.096 174 110.873 174C86.7384 174 65.0031 164.852 48.5549 149.615C47.2658 148.423 48.424 146.794 49.9749 147.72C67.7121 158.308 89.6704 164.668 112.331 164.668C127.607 164.668 144.438 161.43 159.888 154.686C162.233 153.683 164.186 156.257 161.894 158.002M120.018 102.131C120.018 108.758 120.187 114.27 116.989 120.141C114.415 124.911 110.325 127.849 105.765 127.849C99.5374 127.849 95.9221 122.889 95.9221 115.559C95.9221 101.093 108.304 98.4611 120.022 98.4611L120.022 102.136M136.379 143.493C135.317 144.496 133.766 144.574 132.555 143.91C127.18 139.231 126.211 137.055 123.24 132.585C114.343 142.092 108.057 144.932 96.5085 144.932C82.8614 144.932 72.2288 136.129 72.2288 118.497C72.2288 104.729 79.3673 95.3391 89.5105 90.753C98.2967 86.7002 110.601 85.9828 120.008 84.863L120.008 82.6669C120.008 78.6335 120.313 73.8632 118.06 70.3776C116.073 67.2508 112.288 65.9661 108.954 65.9661C102.765 65.9661 97.2548 69.2819 95.9124 76.1562C95.6265 77.6881 94.57 79.1861 93.0919 79.2637L77.361 77.5039C76.0379 77.1839 74.5792 76.0641 74.9379 73.9456C78.5725 54.0258 95.8009 48 111.207 48C119.102 48 129.419 50.1961 135.632 56.4449C143.527 64.153 142.771 74.4352 142.771 85.6289L142.771 112.064C142.771 120.019 145.911 123.5 148.887 127.8C149.929 129.318 150.156 131.169 148.848 132.309C145.533 135.227 139.65 140.564 136.412 143.575L136.354 143.517"
                  fill="url(#paint1_radial_39_35)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_39_35"
                    x1="0"
                    y1="0"
                    x2="222"
                    y2="222"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FF9900" />
                    <stop offset="0.5" stopColor="#FF9900" />
                    <stop offset="1" stopColor="#EA580C" />
                  </linearGradient>
                  <radialGradient
                    id="paint1_radial_39_35"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(48 48) rotate(45) scale(178.191 178.229)"
                  >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0.5" />
                  </radialGradient>
                </defs>
              </svg>
            }
          />
        </div>
      </div>
      <div className="col-span-5 border-l border-gray-200 p-5 dark:border-white/20">
        <p className={cn(contentHeadingClassName, "mb-2")}>Resources</p>
        <div className="-mx-2 flex flex-col gap-0.5">
          {RESOURCES.map(({ icon: Icon, name, href }) => (
            <ContentLinkCard
              href={createHref(href, domain)}
              icon={
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 text-gray-600 dark:text-white/60",
                  )}
                />
              }
              title={name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
