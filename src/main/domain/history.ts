import path from "path";
import fs from "fs-extra";
import { app, shell } from "electron";
import { RecordingData, RecordingMeta, RecordingTranscript } from "../../types";
import { invalidateUiKeys } from "../ipc/invalidate-ui";
import { QueryKeys } from "../../query-keys";
import * as searchIndex from "./search";
import * as ffmpeg from "./ffmpeg";
import { getSettings } from "./settings";
import * as postprocess from "./postprocess";

export const init = async () => {
  await fs.ensureDir(path.join(app.getPath("userData"), "recordings"));
};

export const getRecordingsFolder = () => {
  return path.join(app.getPath("userData"), "recordings");
};

export const saveRecording = async (recording: RecordingData) => {
  const date = new Date();
  const folder = path.join(
    getRecordingsFolder(),
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,
  );
  await fs.ensureDir(folder);
  if (recording.mic) {
    await fs.writeFile(
      path.join(folder, "mic.webm"),
      Buffer.from(recording.mic),
    );
  }
  if (recording.screen) {
    await fs.writeFile(
      path.join(folder, "screen.webm"),
      Buffer.from(recording.screen),
    );
  }
  await fs.writeJSON(path.join(folder, "meta.json"), recording.meta, {
    spaces: 2,
  });
  searchIndex.updateRecordingName(folder, recording.meta.name);
  invalidateUiKeys(QueryKeys.History);

  if ((await getSettings()).ffmpeg.autoTriggerPostProcess) {
    postprocess.addToQueue(folder);
    postprocess.startQueue();
  }
};

export const importRecording = async (file: string, meta: RecordingMeta) => {
  const date = new Date(meta.started);
  const folder = path.join(
    getRecordingsFolder(),
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`,
  );
  await fs.ensureDir(folder);
  await ffmpeg.simpleTranscode(file, path.join(folder, "screen.webm"));
  await fs.writeJSON(path.join(folder, "meta.json"), meta, {
    spaces: 2,
  });
  searchIndex.updateRecordingName(folder, meta.name);
  invalidateUiKeys(QueryKeys.History);

  if ((await getSettings()).ffmpeg.autoTriggerPostProcess) {
    postprocess.addToQueue(folder);
    postprocess.startQueue();
  }
};

export const listRecordings = async () => {
  const recordingFolders = await fs.readdir(getRecordingsFolder());
  const items = await Promise.all(
    recordingFolders.map(
      async (recordingFolder) =>
        [
          recordingFolder,
          (await fs.readJson(
            path.join(getRecordingsFolder(), recordingFolder, "meta.json"),
          )) as RecordingMeta,
        ] as const,
    ),
  );
  return items.reverse().reduce(
    (acc, [folder, meta]) => {
      acc[folder] = meta;
      return acc;
    },
    {} as Record<string, RecordingMeta>,
  );
};

export const getRecordingMeta = async (
  recordingId: string,
): Promise<RecordingMeta> =>
  fs.readJson(path.join(getRecordingsFolder(), recordingId, "meta.json"));

export const getRecordingTranscript = async (
  recordingId: string,
): Promise<RecordingTranscript | null> => {
  const file = path.join(getRecordingsFolder(), recordingId, "transcript.json");
  return fs.existsSync(file) ? fs.readJson(file) : null;
};

export const getRecordingAudioFile = async (id: string) => {
  const mp3 = path.join(getRecordingsFolder(), id, "recording.mp3");
  return fs.existsSync(mp3) ? `file://${mp3}` : null;
};

export const updateRecording = async (
  recordingId: string,
  partial: Partial<RecordingMeta>,
) => {
  const meta = await fs.readJson(
    path.join(getRecordingsFolder(), recordingId, "meta.json"),
  );
  await fs.writeJson(
    path.join(getRecordingsFolder(), recordingId, "meta.json"),
    {
      ...meta,
      ...partial,
    },
  );
  searchIndex.updateRecordingName(recordingId, partial.name);
  invalidateUiKeys(QueryKeys.History, recordingId);
  invalidateUiKeys(QueryKeys.History);
};

export const openRecordingFolder = async (recordingId: string) => {
  const folder = path.join(getRecordingsFolder(), recordingId);
  await shell.openPath(folder);
};

export const removeRecording = async (recordingId: string) => {
  const trash = await import("trash");
  await trash.default(path.join(getRecordingsFolder(), recordingId));
  searchIndex.removeRecordingFromIndex(recordingId);
  invalidateUiKeys(QueryKeys.History);
};
