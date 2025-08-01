import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export function MobileWrapper({ 
  children, 
  className, 
  mobileClassName, 
  desktopClassName 
}: MobileWrapperProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      className,
      isMobile ? mobileClassName : desktopClassName
    )}>
      {children}
    </div>
  );
}