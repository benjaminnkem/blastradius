import { StatusTag } from "./status-tag";

export interface PathNode {
  id: string;
  type: string;
  label: string;
  status?: string;
  criticalityBps?: number;
  propagationBps?: number;
}

interface DependencyPathProps {
  nodes: PathNode[];
  highlightedIndex?: number;
  className?: string;
}

export function DependencyPath({ nodes, highlightedIndex, className = "" }: DependencyPathProps) {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className={`font-mono text-xs ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {nodes.map((node, index) => {
          const isHighlighted = highlightedIndex === index;
          const isLast = index === nodes.length - 1;

          return (
            <div key={node.id} className="flex items-center gap-2">
              <div
                className={`p-2 border ${
                  isHighlighted
                    ? "border-[#ffb000] bg-[#1f170a] text-[#ffb000]"
                    : "border-[#1f521f] bg-[#0a0a0a] text-[#c8d2c8]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{node.label}</span>
                  <span className="text-[10px] text-[#79a879] uppercase">[{node.type}]</span>
                </div>
                {node.status && (
                  <div className="mt-1">
                    <StatusTag status={node.status} />
                  </div>
                )}
                {node.criticalityBps !== undefined && (
                  <div className="mt-1 text-[10px] text-[#79a879]">
                    Crit: {(node.criticalityBps / 100).toFixed(0)}% | Prop:{" "}
                    {((node.propagationBps ?? 10000) / 100).toFixed(0)}%
                  </div>
                )}
              </div>
              {!isLast && (
                <span className="text-[#33ff00] font-bold text-sm select-none">-&gt;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
