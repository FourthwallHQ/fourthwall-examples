import { cn } from '../lib/cn';

export interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * A user message in a chat thread: right-aligned filled bubble with a tail
 * corner. Assistant turns are <ChatTurn>; the bubble is only for the human.
 */
export function ChatBubble({ className, children, ...props }: ChatBubbleProps) {
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          'max-w-[70%] rounded-2xl rounded-br-[4px] bg-muted px-4 py-2.5 text-base leading-normal',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
