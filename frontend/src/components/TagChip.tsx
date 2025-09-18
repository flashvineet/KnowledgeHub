import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagChipProps {
  tag: string;
  selected?: boolean;
  removable?: boolean;
  onClick?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  className?: string;
}

const TagChip: React.FC<TagChipProps> = ({
  tag,
  selected = false,
  removable = false,
  onClick,
  onRemove,
  className,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(tag);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  return (
    <Badge
      variant={selected ? "default" : "secondary"}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-105",
        selected && "bg-primary text-primary-foreground shadow-sm",
        onClick && "hover:bg-primary/20",
        removable && "pr-1",
        className
      )}
      onClick={handleClick}
    >
      <span className="text-xs font-medium">{tag}</span>
      {removable && (
        <button
          onClick={handleRemove}
          className="ml-1 flex h-3 w-3 items-center justify-center rounded-full hover:bg-background/20 transition-colors"
        >
          <X className="h-2 w-2" />
        </button>
      )}
    </Badge>
  );
};

export default TagChip;