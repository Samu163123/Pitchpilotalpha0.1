import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TranscriptItem } from "@/components/transcript-item"
import type { TranscriptSegment } from "@/lib/types"

interface TranscriptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transcript: TranscriptSegment[]
  title?: string
}

export function TranscriptModal({ open, onOpenChange, transcript, title = "Transcript" }: TranscriptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-4">
          {transcript.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transcript available</p>
            </div>
          ) : (
            transcript.map((segment) => <TranscriptItem key={segment.id} segment={segment} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
