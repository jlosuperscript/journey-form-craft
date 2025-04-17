
import React from "react";
import { Textarea } from "@/components/ui/textarea";

type BannerMessageFieldProps = {
  bannerMessage: string;
  setBannerMessage: (value: string) => void;
};

const BannerMessageField: React.FC<BannerMessageFieldProps> = ({
  bannerMessage,
  setBannerMessage,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Warning Banner:</h3>
      <div className="space-y-2">
        <Textarea
          placeholder="This section is only visible when specific conditions are met..."
          value={bannerMessage}
          onChange={(e) => setBannerMessage(e.target.value)}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">
          This message will be shown when the section is hidden due to conditions not being met.
        </p>
      </div>
    </div>
  );
};

export default BannerMessageField;
