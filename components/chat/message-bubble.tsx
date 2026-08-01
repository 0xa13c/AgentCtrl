import { ChatMessage } from "@/types/chat";
import { AgentIcon } from "@/components/hud/agent-icon";
import { cn } from "@/lib/utils";

const AGENT_GLOW: Record<string, string> = {
  hermes: "border-neon-cyan/30 bg-neon-cyan/10",
  codex: "border-neon-violet/30 bg-neon-violet/10",
  openclaw: "border-neon-magenta/30 bg-neon-magenta/10",
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className={cn("mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", AGENT_GLOW[message.agentId])}>
          <AgentIcon agentId={message.agentId} size={16} />
        </div>
      )}
      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", isUser ? "bg-neon-cyan/10 border border-neon-cyan/30 text-foreground" : "bg-black/30 border border-white/[0.06] text-foreground")}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.taskId && (
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-neon-amber">→ linked task created</p>
        )}
        <p className="mt-1 font-mono text-[9px] text-muted-foreground">
          {new Date(message.createdAt).toLocaleTimeString("en-US", { hour12: false })}
        </p>
      </div>
    </div>
  );
}
