import { cn } from "lib";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "max-w-fit rounded-full border px-2 py-px text-xs font-medium capitalize",
  {
    variants: {
      variant: {
        default: "border-gray-400 text-gray-500",
        violet: "border-violet-600 bg-violet-600 text-white",
        blue: "border-blue-500 bg-blue-500 text-white",
        black: "border-black bg-black text-white",
        gray: "border-gray-400 bg-gray-400 text-white",
        neutral: "border-gray-400 text-gray-500",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
