import { FC, useState } from "react";
import { Badge, DropdownMenu, IconButton } from "@radix-ui/themes";
import {
  HiArrowTopRightOnSquare,
  HiMiniBars3,
  HiMiniPhone,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
} from "react-icons/hi2";
import { RecordingMeta } from "../../types";
import { historyApi } from "../api";
import { ListItem } from "../common/list-item";

export const HistoryItem: FC<{ recording: RecordingMeta; id: string }> = ({
  recording,
  id,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <ListItem
      title={recording.name || "Untitled"}
      subtitle={new Date(recording.started).toLocaleString()}
      onRename={(name) => historyApi.updateRecordingMeta(id, { name })}
      tags={
        !recording.isPostProcessed && <Badge color="orange">Unprocessed</Badge>
      }
      icon={<HiMiniPhone />}
      forceHoverState={dropdownOpen}
    >
      <DropdownMenu.Root onOpenChange={setDropdownOpen}>
        <DropdownMenu.Trigger>
          <IconButton variant="outline">
            <HiMiniBars3 />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item
            onClick={() => historyApi.openRecordingDetailsWindow(id)}
          >
            <HiArrowTopRightOnSquare /> Open Recording
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={async () => historyApi.openRecordingFolder(id)}
          >
            <HiOutlineFolderOpen /> Open Folder
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={async () => {
              await historyApi.addToPostProcessingQueue(id);
              await historyApi.startPostProcessing();
            }}
          >
            <HiOutlineDocumentText /> Postprocess
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <IconButton onClick={() => historyApi.openRecordingDetailsWindow(id)}>
        <HiArrowTopRightOnSquare />
      </IconButton>
    </ListItem>
  );
};
