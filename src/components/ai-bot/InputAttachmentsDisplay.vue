<script setup lang="ts">
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-bot/ai-elements/attachments'
import type { AttachmentData } from '@/components/ai-bot/ai-elements/attachments/types'
import type { AttachmentFile } from '@/components/ai-bot/lib/input-types'
import { usePromptInput } from '@/components/ai-bot/lib/prompt-input'

const { files, removeFile } = usePromptInput()

function asAttachmentData(file: AttachmentFile): AttachmentData {
  return file as unknown as AttachmentData
}
</script>

<template>
  <Attachments
    v-if="files.length > 0"
    variant="inline"
    class="attachments-inline"
  >
    <Attachment
      v-for="attachment in files"
      :key="attachment.id"
      :data="asAttachmentData(attachment)"
      :title="attachment.filename"
      @remove="removeFile(attachment.id)"
    >
      <AttachmentPreview />
      <AttachmentInfo class="attachment-info" :title="attachment.filename" />
      <AttachmentRemove />
    </Attachment>
  </Attachments>
</template>

<style scoped>
.attachments-inline {
  justify-content: flex-start;
}

.attachment-info {
  max-width: 100px;
  min-width: 0;
  font-size: 11px;
}
</style>
