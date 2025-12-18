# Cornell Reader V1 - Implementation Plan

**Feature**: Dual-mode document reader with Cornell notes and highlights  
**Estimated Effort**: 15-20 hours  
**Priority**: High (Core learning feature)  
**Status**: Ready for Implementation

---

## 🎯 Objectives

### V1 Scope (Script 1/5)

- ✅ Source View (PDF/Image/DOCX render)
- ✅ Study Layer (highlights + Cornell notes)
- ✅ Autosave with status indicators
- ✅ SaaS entitlements enforcement
- ⏸️ AI features (stub only)
- ⏸️ Extraction pipeline (future)

### Out of Scope V1

- OCR processing
- AI-powered suggestions
- Collaborative features
- Mobile app

---

## 📊 Database Schema

### 1. Files Table

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  storage_provider TEXT NOT NULL, -- LOCAL, S3, GCS
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum_sha256 TEXT,
  original_filename TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_storage ON files(storage_provider, storage_key);
```

### 2. Contents Table

```sql
CREATE TABLE contents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  scope_type TEXT, -- USER, INSTITUTION
  scope_id TEXT,
  content_type TEXT NOT NULL, -- PDF, IMAGE, DOCX, NEWS, ARTICLE
  title TEXT NOT NULL,
  source_url TEXT,
  file_id TEXT REFERENCES files(id),
  language_guess TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contents_owner ON contents(owner_user_id);
CREATE INDEX idx_contents_type ON contents(content_type);
```

### 3. Cornell Notes Table

```sql
CREATE TABLE cornell_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  cues_json JSONB DEFAULT '[]'::jsonb,
  notes_json JSONB DEFAULT '[]'::jsonb,
  summary_text TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(content_id, user_id)
);

CREATE INDEX idx_cornell_content ON cornell_notes(content_id);
CREATE INDEX idx_cornell_user ON cornell_notes(user_id);
```

**JSON Structure**:

```typescript
// cues_json
[{
  id: string,
  prompt: string,
  linked_highlight_ids: string[]
}]

// notes_json
[{
  id: string,
  body: string,
  linked_highlight_ids: string[]
}]
```

### 4. Highlights Table

```sql
CREATE TABLE highlights (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL, -- TEXT, AREA
  target_type TEXT NOT NULL, -- PDF, IMAGE, DOCX
  page_number INT,
  anchor_json JSONB NOT NULL,
  color_key TEXT DEFAULT 'yellow',
  comment_text TEXT,
  tags_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_highlights_content ON highlights(content_id);
CREATE INDEX idx_highlights_user ON highlights(user_id);
CREATE INDEX idx_highlights_kind ON highlights(kind);
```

**anchor_json Formats**:

```typescript
// PDF TEXT
{
  type: "PDF_TEXT",
  position: {
    boundingRect: { x1, y1, x2, y2, width, height },
    rects: [{ x1, y1, x2, y2, width, height, pageNumber }],
    pageNumber: number
  }
}

// PDF AREA
{
  type: "PDF_AREA",
  position: {
    boundingRect: { x1, y1, x2, y2, width, height },
    pageNumber: number
  },
  image_snapshot_key?: string
}

// IMAGE AREA
{
  type: "IMAGE_AREA",
  rect: { x: number, y: number, w: number, h: number },
  zoom: number,
  viewport: { width: number, height: number }
}

// DOCX TEXT
{
  type: "DOCX_TEXT",
  range: {
    startPath: string[],
    startOffset: number,
    endPath: string[],
    endOffset: number
  },
  quote: string
}
```

### 5. Content Extractions (Future - stub for V1)

```sql
CREATE TABLE content_extractions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING', -- PENDING, RUNNING, DONE, FAILED
  extracted_text_ref TEXT,
  metadata_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Usage Events (Billing integration)

```sql
-- Already exists, just add new metrics
-- New metrics for Cornell Reader:
-- - 'file_upload'
-- - 'highlight_create'
-- - 'cornell_note_save'
-- - 'extraction_triggered'
```

---

## 🔧 Backend Implementation

### API Endpoints (8 total)

#### Content & Files

```python
# services/api/src/cornell/cornell.controller.ts

@Get('/contents/:id')
@UseGuards(AuthGuard('jwt'))
async getContent(@Param('id') id: string, @Request() req) {
  # Verify ownership or shared access
  # Return: { id, title, content_type, file: { view_url }, source_url }
}

@Get('/files/:id/view-url')
@UseGuards(AuthGuard('jwt'))
async getFileViewUrl(@Param('id') id: string) {
  # Generate signed URL (S3) or proxy route
  # Return: { url, expires_at }
}
```

#### Cornell Notes

```python
@Get('/contents/:id/cornell')
@UseGuards(AuthGuard('jwt'))
async getCornellNotes(
  @Param('id') contentId: string,
  @Request() req
) {
  # Get or create cornell_notes for user + content
  # Return: { id, cues_json, notes_json, summary_text }
}

@Put('/contents/:id/cornell')
@UseGuards(AuthGuard('jwt'))
async updateCornellNotes(
  @Param('id') contentId: string,
  @Body() dto: UpdateCornellDto,
  @Request() req
) {
  # Validate ownership
  # Update cues/notes/summary
  # Track usage_event: 'cornell_note_save'
  # Return updated cornell_notes
}
```

#### Highlights

```python
@Get('/contents/:id/highlights')
@UseGuards(AuthGuard('jwt'))
async getHighlights(@Param('id') contentId: string, @Request() req) {
  # Return all highlights for content + user
  # Include: id, kind, anchor_json, color_key, comment_text, tags
}

@Post('/contents/:id/highlights')
@UseGuards(AuthGuard('jwt'))
async createHighlight(
  @Param('id') contentId: string,
  @Body() dto: CreateHighlightDto,
  @Request() req
) {
  # Validate dto
  # Create highlight
  # Track usage_event: 'highlight_create'
  # Return created highlight
}

@Put('/highlights/:id')
@UseGuards(AuthGuard('jwt'))
async updateHighlight(
  @Param('id') id: string,
  @Body() dto: UpdateHighlightDto
) {
  # Verify ownership
  # Update comment_text, tags, color_key
  # Return updated highlight
}

@Delete('/highlights/:id')
@UseGuards(AuthGuard('jwt'))
async deleteHighlight(@Param('id') id: string) {
  # Verify ownership
  # Delete highlight
  # Return success
}
```

### DTOs

```typescript
// src/cornell/dto/cornell.dto.ts

export class UpdateCornellDto {
  @IsArray()
  @IsOptional()
  cues_json?: CueItem[];

  @IsArray()
  @IsOptional()
  notes_json?: NoteItem[];

  @IsString()
  @IsOptional()
  summary_text?: string;
}

export class CreateHighlightDto {
  @IsEnum(["TEXT", "AREA"])
  kind: "TEXT" | "AREA";

  @IsEnum(["PDF", "IMAGE", "DOCX"])
  target_type: string;

  @IsOptional()
  @IsInt()
  page_number?: number;

  @IsObject()
  anchor_json: any;

  @IsString()
  @IsOptional()
  color_key?: string;

  @IsString()
  @IsOptional()
  comment_text?: string;

  @IsArray()
  @IsOptional()
  tags_json?: string[];
}
```

### Services

```typescript
// src/cornell/cornell.service.ts

@Injectable()
export class CornellService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private usageTracking: UsageTrackingService
  ) {}

  async getOrCreateCornellNotes(contentId: string, userId: string) {
    let notes = await this.prisma.cornellNotes.findUnique({
      where: { content_id_user_id: { content_id: contentId, user_id: userId } },
    });

    if (!notes) {
      notes = await this.prisma.cornellNotes.create({
        data: {
          content_id: contentId,
          user_id: userId,
          cues_json: [],
          notes_json: [],
          summary_text: "",
        },
      });
    }

    return notes;
  }

  async updateCornellNotes(id: string, data: UpdateCornellDto, userId: string) {
    // Track usage
    await this.usageTracking.trackUsage({
      scopeType: "USER",
      scopeId: userId,
      metric: "cornell_note_save",
      quantity: 1,
      environment: process.env.NODE_ENV as any,
    });

    return this.prisma.cornellNotes.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }
}
```

---

## 🎨 Frontend Implementation

### Dependencies

```json
{
  "dependencies": {
    "react-pdf": "^7.7.0",
    "react-pdf-highlighter": "^6.1.0",
    "pdfjs-dist": "^3.11.174",
    "konva": "^9.2.3",
    "react-konva": "^18.2.10",
    "mammoth": "^1.6.0",
    "use-debounce": "^10.0.0",
    "zustand": "^4.5.0"
  }
}
```

### Page Structure

```tsx
// app/reader/[contentId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CornellLayout } from "@/components/cornell/CornellLayout";
import { PDFViewer } from "@/components/cornell/viewers/PDFViewer";
import { ImageViewer } from "@/components/cornell/viewers/ImageViewer";
import { DocxViewer } from "@/components/cornell/viewers/DocxViewer";

export default function ReaderPage({
  params,
}: {
  params: { contentId: string };
}) {
  const [mode, setMode] = useState<"original" | "study">("study");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">(
    "saved"
  );

  const { data: content } = useQuery({
    queryKey: ["content", params.contentId],
    queryFn: () => api.get(`/contents/${params.contentId}`).then((r) => r.data),
  });

  const { data: cornell } = useQuery({
    queryKey: ["cornell", params.contentId],
    queryFn: () =>
      api.get(`/contents/${params.contentId}/cornell`).then((r) => r.data),
  });

  const { data: highlights } = useQuery({
    queryKey: ["highlights", params.contentId],
    queryFn: () =>
      api.get(`/contents/${params.contentId}/highlights`).then((r) => r.data),
  });

  const renderViewer = () => {
    switch (content?.content_type) {
      case "PDF":
        return (
          <PDFViewer content={content} mode={mode} highlights={highlights} />
        );
      case "IMAGE":
        return (
          <ImageViewer content={content} mode={mode} highlights={highlights} />
        );
      case "DOCX":
        return (
          <DocxViewer content={content} mode={mode} highlights={highlights} />
        );
      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
    <CornellLayout
      topBar={{
        title: content?.title,
        mode,
        onModeToggle: setMode,
        saveStatus,
      }}
      cues={cornell?.cues_json || []}
      onCuesChange={(cues) => {
        /* autosave */
      }}
      notes={cornell?.notes_json || []}
      onNotesChange={(notes) => {
        /* autosave */
      }}
      summary={cornell?.summary_text || ""}
      onSummaryChange={(summary) => {
        /* autosave */
      }}
      viewer={renderViewer()}
    />
  );
}
```

### Cornell Layout Component

```tsx
// components/cornell/CornellLayout.tsx

export function CornellLayout({
  topBar,
  cues,
  onCuesChange,
  notes,
  onNotesChange,
  summary,
  onSummaryChange,
  viewer,
}: CornellLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b flex items-center justify-between px-4">
        <h1 className="text-xl font-bold">{topBar.title}</h1>

        <div className="flex items-center gap-4">
          {/* Mode Toggle */}
          <button
            onClick={() =>
              topBar.onModeToggle(
                topBar.mode === "original" ? "study" : "original"
              )
            }
            className="px-4 py-2 rounded"
          >
            {topBar.mode === "original" ? "Study Mode" : "Original View"}
          </button>

          {/* Save Status */}
          <div className="flex items-center gap-2">
            {topBar.saveStatus === "saving" && <Spinner size="sm" />}
            {topBar.saveStatus === "saved" && (
              <Check className="text-green-500" />
            )}
            {topBar.saveStatus === "offline" && (
              <AlertCircle className="text-red-500" />
            )}
            <span className="text-sm">{topBar.saveStatus}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Cues */}
        <div className="w-80 border-r p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Cues & Questions</h2>
          <CuesEditor cues={cues} onChange={onCuesChange} />
        </div>

        {/* Center: Viewer */}
        <div className="flex-1 overflow-hidden">{viewer}</div>

        {/* Right: Notes */}
        <div className="w-80 border-l p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Notes</h2>
          <NotesEditor notes={notes} onChange={onNotesChange} />
        </div>
      </div>

      {/* Bottom: Summary */}
      <div className="h-48 border-t p-4">
        <h2 className="font-semibold mb-2">Summary</h2>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          className="w-full h-32 p-2 border rounded"
          placeholder="Write your summary here..."
        />
      </div>
    </div>
  );
}
```

### PDF Viewer with Highlights

```tsx
// components/cornell/viewers/PDFViewer.tsx

import { PdfLoader, PdfHighlighter, Highlight } from "react-pdf-highlighter";

export function PDFViewer({ content, mode, highlights }: PDFViewerProps) {
  const [pdfHighlights, setPdfHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    // Convert backend highlights to react-pdf-highlighter format
    const converted = highlights
      ?.filter((h) => h.target_type === "PDF")
      .map((h) => ({
        id: h.id,
        position: h.anchor_json.position,
        comment: { text: h.comment_text, emoji: "" },
        content: { text: h.anchor_json.quote },
      }));
    setPdfHighlights(converted || []);
  }, [highlights]);

  const handleAddHighlight = async (highlight: Highlight) => {
    // Create highlight via API
    await api.post(`/contents/${content.id}/highlights`, {
      kind: highlight.content.image ? "AREA" : "TEXT",
      target_type: "PDF",
      page_number: highlight.position.pageNumber,
      anchor_json: {
        type: highlight.content.image ? "PDF_AREA" : "PDF_TEXT",
        position: highlight.position,
        quote: highlight.content.text,
      },
      color_key: "yellow",
    });
  };

  if (mode === "original") {
    // Simple PDF render without highlighter
    return <PdfLoader url={content.file.view_url} />;
  }

  return (
    <PdfHighlighter
      pdfUrl={content.file.view_url}
      highlights={pdfHighlights}
      onAddHighlight={handleAddHighlight}
      onUpdateHighlight={(id, position, content) => {
        /* update */
      }}
    />
  );
}
```

### Image Viewer with Konva

```tsx
// components/cornell/viewers/ImageViewer.tsx

import { Stage, Layer, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";

export function ImageViewer({ content, mode, highlights }: ImageViewerProps) {
  const [image] = useImage(content.file.view_url);
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Rect | null>(null);

  const handleMouseDown = (e) => {
    if (mode !== "study") return;
    const pos = e.target.getStage().getPointerPosition();
    setSelecting(true);
    setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!selecting) return;
    const pos = e.target.getStage().getPointerPosition();
    setSelection((prev) => ({
      ...prev,
      w: pos.x - prev.x,
      h: pos.y - prev.y,
    }));
  };

  const handleMouseUp = async () => {
    if (!selecting || !selection) return;
    setSelecting(false);

    // Create highlight
    await api.post(`/contents/${content.id}/highlights`, {
      kind: "AREA",
      target_type: "IMAGE",
      anchor_json: {
        type: "IMAGE_AREA",
        rect: selection,
        zoom: 1,
        viewport: { width: image.width, height: image.height },
      },
      color_key: "yellow",
    });

    setSelection(null);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        <KonvaImage image={image} />

        {/* Existing highlights */}
        {highlights
          ?.filter((h) => h.target_type === "IMAGE")
          .map((h) => (
            <Rect
              key={h.id}
              {...h.anchor_json.rect}
              stroke="yellow"
              strokeWidth={2}
              dash={[5, 5]}
            />
          ))}

        {/* Selection in progress */}
        {selecting && selection && (
          <Rect {...selection} stroke="blue" strokeWidth={2} dash={[5, 5]} />
        )}
      </Layer>
    </Stage>
  );
}
```

### Autosave Hook

```tsx
// hooks/useAutosave.ts

import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";

export function useAutosave<T>(
  saveFn: (data: T) => Promise<void>,
  delay = 1000
) {
  const [status, setStatus] = useState<"saved" | "saving" | "offline">("saved");

  const save = useDebouncedCallback(async (data: T) => {
    try {
      setStatus("saving");
      await saveFn(data);
      setStatus("saved");
    } catch (error) {
      setStatus("offline");
      // Retry logic here
    }
  }, delay);

  return { save, status };
}
```

---

## 📋 Implementation Checklist

### Database (2h)

- [ ] Create migration for 6 tables
- [ ] Add indexes
- [ ] Run migration
- [ ] Test data insertion

### Backend (6-8h)

- [ ] Create CornellModule
- [ ] Implement CornellService
- [ ] Implement StorageService (S3 integration)
- [ ] Create 8 API endpoints
- [ ] Add DTOs with validation
- [ ] Add entitlements checks
- [ ] Usage tracking integration
- [ ] Test all endpoints

### Frontend (7-9h)

- [ ] Install dependencies (PDF.js, Konva, Mammoth)
- [ ] Create CornellLayout component
- [ ] Implement PDFViewer with highlights
- [ ] Implement ImageViewer with Konva
- [ ] Implement DocxViewer with Mammoth
- [ ] Create Cues/Notes/Summary editors
- [ ] Implement autosave hook
- [ ] Add highlight linking UI
- [ ] Navigation on click cue/note
- [ ] Save status indicator
- [ ] Test all viewers

---

## 🎯 Success Criteria

- ✅ PDF renders faithfully in Source View
- ✅ Text highlights work on PDFs with text layer
- ✅ Area highlights work on all content types
- ✅ Image viewer allows area selection and annotation
- ✅ DOCX converts to HTML and allows text highlights
- ✅ Cornell notes autosave reliably
- ✅ Toggle Original/Study doesn't break
- ✅ Linking highlights to cues/notes works
- ✅ Clicking linked cue navigates to highlight
- ✅ Save status accurate (Saving/Saved/Offline)
- ✅ Entitlements enforced on upload

---

## 🚀 Deployment Notes

- PDF.js needs web worker configured
- S3 CORS for signed URLs
- File upload size limits (nginx/backend)
- Storage cleanup cron (orphaned files)

**Total Estimated Time**: **15-20 hours**  
**Ready for implementation!** 🎯
