import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { withUt } from "uploadthing/tw";

const flowbite = require("flowbite-react/tailwind");

export default withUt({
  content: [
    "./src/**/*.tsx",
    flowbite.content(),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [
    flowbite.plugin(),
  ],
}) satisfies Config;
