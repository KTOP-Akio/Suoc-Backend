import { motion } from "framer-motion";
import { FRAMER_MOTION_LIST_ITEM_VARIANTS } from "#/lib/constants";

export default function PlaceholderCard() {
  return (
    <motion.li
      variants={FRAMER_MOTION_LIST_ITEM_VARIANTS}
      className="flex items-center rounded-md border border-gray-200 bg-white p-3 shadow-lg"
    >
      <div className="mr-2 h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="mb-2.5 flex items-center space-x-2">
          <div className="h-6 w-28 rounded-md bg-gray-200" />
          <div className="h-6 w-6 rounded-full bg-gray-200" />
          <div className="h-6 w-20 rounded-md bg-gray-200" />
        </div>
        <div className="h-4 rounded-md bg-gray-200" />
      </div>
    </motion.li>
  );
}
