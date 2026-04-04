import gxIcon from "@/assets/gx-icon.png";
import { cn } from "@/lib/utils";

interface GxIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const GxIcon = ({ className, style }: GxIconProps) => (
  <img
    src={gxIcon}
    alt="GX"
    className={cn("inline-block object-contain", className)}
    style={style}
    aria-hidden="true"
  />
);

export default GxIcon;
