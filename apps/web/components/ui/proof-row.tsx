interface ProofRowProps {
  entityKey: string;
  creator: string;
  block?: number;
  expiresInSec?: number;
  className?: string;
}

export function ProofRow({
  entityKey,
  creator,
  block,
  expiresInSec,
  className = "",
}: ProofRowProps) {
  const shortKey = `${entityKey.slice(0, 10)}...${entityKey.slice(-8)}`;
  const shortCreator = `${creator.slice(0, 8)}...${creator.slice(-6)}`;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 border border-[#1f521f] bg-[#0a120a] font-mono text-xs gap-2 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-[#33ff00] font-bold">ARKIV_ENTITY:</span>
        <span
          className="text-[#c8d2c8] underline decoration-[#1f521f] cursor-pointer hover:text-[#33ff00]"
          title={entityKey}
        >
          {shortKey}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[#79a879]">
        <span>
          BY: <span className="text-[#c8d2c8]">{shortCreator}</span>
        </span>
        {block && (
          <span>
            BLK: <span className="text-[#c8d2c8]">#{block}</span>
          </span>
        )}
        {expiresInSec !== undefined && (
          <span>
            TTL: <span className="text-[#ffb000]">{expiresInSec}s</span>
          </span>
        )}
      </div>
    </div>
  );
}
