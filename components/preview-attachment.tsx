import type { Attachment } from "ai";

import { LoaderIcon } from "./icons";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center">
          {contentType ? (
            contentType.startsWith("image") ? (
              // NOTE: it is recommended to use next/image for images
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={name ?? "An image attachment"}
                className="rounded-md size-full object-cover"
              />
            ) : (
              <div className="text-sm font-bold">PDF</div>
            )
          ) : (
            <div className="" />
          )}

          {isUploading && (
            <div className="animate-spin absolute text-zinc-500">
              <LoaderIcon />
            </div>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-zinc-500 max-w-16 truncate cursor-help">
              {name?.slice(name?.indexOf("-") + 1)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
