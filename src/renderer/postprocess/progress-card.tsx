import { FC } from "react";
import { Heading, Spinner, Text } from "@radix-ui/themes";
import {
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import type { getProgressData } from "../../main/domain/postprocess";
import { ProgressStep } from "./progress-step";
import { useHistoryRecordings } from "../history/state";
import { ProgressCardWrapper } from "./progress-card-wrapper";

const allSteps = ["wav", "mp3", "modelDownload", "whisper", "summary"] as const;
const stepLabels = {
  modelDownload: "Downloading model",
  wav: "Preparing audio",
  mp3: "Generating MP3 file",
  whisper: "Transcribing audio",
  summary: "Generating summary",
};

export const ProgressCard: FC<{
  id: string;
  data: Awaited<ReturnType<typeof getProgressData>>;
}> = ({ id, data }) => {
  const { data: recordings } = useHistoryRecordings();
  const recording = recordings?.[id];
  const name = recording?.name ?? "Untitled recording";

  if (data.errors[id]) {
    return (
      <ProgressCardWrapper
        header={<Text color="red">{name}</Text>}
        icon={<HiOutlineExclamationTriangle color="var(--red-11)" />}
      >
        <pre
          style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px" }}
        >
          {data.errors[id]}
        </pre>
      </ProgressCardWrapper>
    );
  }

  if (data.doneList.includes(id)) {
    return (
      <ProgressCardWrapper
        header={
          <Text color="green">{recording?.name ?? "Untitled recording"}</Text>
        }
        icon={<HiOutlineCheckCircle color="var(--green-11)" />}
      />
    );
  }

  if (data.currentlyProcessing === id) {
    return (
      <ProgressCardWrapper
        icon={<Spinner size="3" />}
        header={
          <>
            <Heading>{name}</Heading>
            <Text>File is processing...</Text>
          </>
        }
      >
        {allSteps.map((item, index) => (
          <ProgressStep
            key={item}
            label={stepLabels[item]}
            isRunning={item === data.currentStep}
            isDone={allSteps.indexOf(data.currentStep as any) > index}
            progress={data.progress[item]}
          />
        ))}
      </ProgressCardWrapper>
    );
  }

  return (
    <ProgressCardWrapper
      icon={<HiOutlineEllipsisHorizontalCircle />}
      header={<Text>{recording?.name ?? "Untitled recording"}</Text>}
    />
  );
};
