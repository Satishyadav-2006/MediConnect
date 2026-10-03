import { useState, useRef, useCallback, useEffect } from 'react'
import { FiImage, FiVideo, FiFileText, FiBarChart2, FiGlobe, FiUsers, FiLock, FiX, FiPlus, FiTrash2, FiChevronDown, FiClock, FiFile, FiBookOpen } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/utils'
import { postService, type CreatePostPayload, type PostMediaItem } from '@/api/postService'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/config/i18n'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'

const visOptions = [
  { value: 'public', icon: <FiGlobe size={14} />, label: 'Public' },
  { value: 'connections', icon: <FiUsers size={14} />, label: 'Connections Only' },
  { value: 'organization', icon: <FiLock size={14} />, label: 'Organization Only' },
]

const pollDurationOptions = [
  { value: '1', label: '1 Day' },
  { value: '3', label: '3 Days' },
  { value: '7', label: '7 Days' },
]

const RESEARCH_AREAS = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Family Medicine', 'Gastroenterology', 'General Surgery', 'Neurology',
  'Oncology', 'Pediatrics', 'Psychiatry', 'Radiology',
]

const RECENT_EMOJIS = ['😀', '😂', '😍', '🥳', '🤔', '👍', '❤️', '🔥', '💡', '🎯', '✅', '⚕️', '🔬', '📊', '💊', '🏥']

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  'Gestures': ['👍', '👎', '👌', '🤌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🦿', '🦵', '🦶'],
  'Medical': ['⚕️', '🩺', '🩻', '💊', '💉', '🩹', '🩼', '🧬', '🔬', '🧪', '🏥', '🚑', '🫀', '🫁', '🧠', '🦴', '🫀', '🫁', '🦷', '🦴', '🩸', '🫁', '🧫', '🧬', '🦠', '🔬', '🧫'],
  'Objects': ['📊', '📈', '📉', '📋', '📁', '📂', '📝', '📄', '📑', '🧾', '📊', '📈', '📉', '💡', '🔦', '🔍', '🔎', '📡', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '📱', '📞', '☎️', '📟', '📠', '📺', '📻'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Symbols': ['✅', '❌', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔘', '🔹', '🔶', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜'],
}

interface PollData {
  question: string
  options: string[]
  duration: string
  anonymous: boolean
}

interface ResearchData {
  title: string
  abstract: string
  authors: string
  journal: string
  doi: string
  researchArea: string
  keywords: string
}

type PostMode = 'text' | 'poll' | 'research'

interface Attachment {
  id: string
  file: File
  kind: 'image' | 'video'
  previewUrl: string
}

export default function PostComposer() {
  const { user } = useAuth()
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [isExpanded, setIsExpanded] = useState(false)
  const [postMode, setPostMode] = useState<PostMode>('text')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Smileys')
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentPreview, setDocumentPreview] = useState<{ name: string; size: string; type: string } | null>(null)

  const [mediaFiles, setMediaFiles] = useState<Attachment[]>([])
  const [postError, setPostError] = useState<string | null>(null)
  const mediaFilesRef = useRef<Attachment[]>([])
  useEffect(() => { mediaFilesRef.current = mediaFiles }, [mediaFiles])
  useEffect(() => () => { mediaFilesRef.current.forEach(m => URL.revokeObjectURL(m.previewUrl)) }, [])

  const [poll, setPoll] = useState<PollData>({
    question: '',
    options: ['', ''],
    duration: '3',
    anonymous: false,
  })
  const [showPollPreview, setShowPollPreview] = useState(false)

  const [research, setResearch] = useState<ResearchData>({
    title: '',
    abstract: '',
    authors: '',
    journal: '',
    doi: '',
    researchArea: '',
    keywords: '',
  })
  const [researchFile, setResearchFile] = useState<File | null>(null)

  const resetAll = useCallback(() => {
    setContent('')
    setVisibility('public')
    setIsExpanded(false)
    setPostMode('text')
    setShowEmojiPicker(false)
    setShowVisibilityDropdown(false)
    setShowPreview(false)
    setDocumentFile(null)
    setDocumentPreview(null)
    setPostError(null)
    setMediaFiles(prev => {
      prev.forEach(m => URL.revokeObjectURL(m.previewUrl))
      return []
    })
    setPoll({ question: '', options: ['', ''], duration: '3', anonymous: false })
    setShowPollPreview(false)
    setResearch({ title: '', abstract: '', authors: '', journal: '', doi: '', researchArea: '', keywords: '' })
    setResearchFile(null)
  }, [])

  const handleCancel = useCallback(() => { resetAll() }, [resetAll])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const handleDocumentSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocumentFile(file)
      setDocumentPreview({ name: file.name, size: formatFileSize(file.size), type: file.type })
    }
  }, [])

  const removeDocument = useCallback(() => {
    setDocumentFile(null)
    setDocumentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'video') => {
    const files = Array.from(e.target.files ?? [])
    const next = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      kind,
      previewUrl: URL.createObjectURL(file),
    }))
    setMediaFiles(prev => [...prev, ...next].slice(0, 4))
    if (e.target) e.target.value = ''
  }, [])

  const removeMedia = useCallback((id: string) => {
    setMediaFiles(prev => {
      const target = prev.find(m => m.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter(m => m.id !== id)
    })
  }, [])

  const handleResearchFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setResearchFile(file)
  }, [])

  const insertEmoji = useCallback((emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent(prev => prev + emoji)
    }
  }, [content])

  const addPollOption = useCallback(() => {
    if (poll.options.length < 5) {
      setPoll(prev => ({ ...prev, options: [...prev.options, ''] }))
    }
  }, [poll.options.length])

  const removePollOption = useCallback((index: number) => {
    if (poll.options.length > 2) {
      setPoll(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }))
    }
  }, [poll.options.length])

  const updatePollOption = useCallback((index: number, value: string) => {
    setPoll(prev => ({ ...prev, options: prev.options.map((o, i) => i === index ? value : o) }))
  }, [])

  const createMutation = useMutation({
    mutationFn: async () => {
      const items: PostMediaItem[] = []
      const uploads: Promise<PostMediaItem>[] = mediaFiles.map(m =>
        postService.uploadPostMedia(m.file).then(res => ({
          cloudinary_url: res.data.url as string,
          media_type: m.kind,
          file_name: m.file.name,
          mime_type: m.file.type,
          file_size: m.file.size,
        }))
      )
      const attachDocument = (file: File) => postService.uploadDocument(file).then(res => ({
        cloudinary_url: res.data.url as string,
        media_type: 'document',
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      }))
      if (documentFile) uploads.push(attachDocument(documentFile))
      if (researchFile) uploads.push(attachDocument(researchFile))
      items.push(...(await Promise.all(uploads)))

      let mediaType: 'text' | 'image' | 'video' | 'document' = 'text'
      if (mediaFiles.some(m => m.kind === 'video')) mediaType = 'video'
      else if (mediaFiles.some(m => m.kind === 'image')) mediaType = 'image'
      else if (items.some(i => i.media_type === 'document')) mediaType = 'document'

      const payload: CreatePostPayload = {
        content,
        visibility,
        post_type: postMode === 'poll' ? 'poll' : postMode === 'research' ? 'research' : mediaType,
        ...(items.length ? { media: items } : {}),
      }

      if (postMode === 'poll') {
        payload.poll = {
          question: poll.question,
          options: poll.options.filter(o => o.trim()),
          endsAt: new Date(Date.now() + parseInt(poll.duration) * 86400000).toISOString(),
        }
      } else if (postMode === 'research') {
        payload.research = {
          title: research.title,
          abstract: research.abstract,
          journal: research.journal || undefined,
          authors: research.authors.split(',').map(a => a.trim()).filter(Boolean),
          doi: research.doi || undefined,
        }
      }

      return postService.createPost(payload)
    },
    onSuccess: () => { resetAll(); queryClient.invalidateQueries({ queryKey: ['feed'] }) },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setPostError(msg || 'Failed to create post. Please try again.')
    },
  })

  const isPostDisabled = postMode === 'poll'
    ? !poll.question.trim() || poll.options.filter(o => o.trim()).length < 2
    : postMode === 'research'
      ? !research.title.trim() || !research.abstract.trim() || !content.trim()
      : !content.trim()

  if (!user) return null

  const visibilityIcon = visOptions.find(v => v.value === visibility)?.icon || <FiGlobe size={14} />
  const visibilityLabel = visOptions.find(v => v.value === visibility)?.label || 'Public'

  return (
    <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
      <div className="flex items-start gap-3">
        <Avatar src={user.profilePhoto} name={user.fullName} />
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder={
              postMode === 'poll' ? 'Write a description for your poll (optional)...'
                : postMode === 'research' ? 'Write a summary or context for this research post...'
                  : t.feed.whatsOnYourMind
            }
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            rows={isExpanded ? 4 : 2}
            className="resize-none"
          />

          {isExpanded && (
            <>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 relative">
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleDocumentSelect} />
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleMediaSelect(e, 'image')} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleMediaSelect(e, 'video')} />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className={cn('rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]', mediaFiles.some(m => m.kind === 'image') && 'text-primary-500 bg-primary-50')}
                    title="Attach Image"
                  >
                    <FiImage size={18} />
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className={cn('rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]', mediaFiles.some(m => m.kind === 'video') && 'text-primary-500 bg-primary-50')}
                    title="Attach Video"
                  >
                    <FiVideo size={18} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn('rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]', documentFile && 'text-primary-500 bg-primary-50')}
                    title="Attach Document"
                  >
                    <FiFileText size={18} />
                  </button>
                  <button
                    onClick={() => setPostMode(p => p === 'research' ? 'text' : 'research')}
                    className={cn('rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]', postMode === 'research' && 'text-primary-500 bg-primary-50')}
                    title="Research Post"
                  >
                    <FiBookOpen size={18} />
                  </button>
                  <button
                    onClick={() => setPostMode(p => p === 'poll' ? 'text' : 'poll')}
                    className={cn('rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]', postMode === 'poll' && 'text-primary-500 bg-primary-50')}
                    title="Create Poll"
                  >
                    <FiBarChart2 size={18} />
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn('rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]', showEmojiPicker && 'text-primary-500 bg-primary-50')}
                    title="Emoji"
                  >
                    <span className="text-lg leading-none">😀</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                      className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                    >
                      {visibilityIcon}
                      <span className="hidden sm:inline">{visibilityLabel}</span>
                      <FiChevronDown size={12} />
                    </button>
                    {showVisibilityDropdown && (
                      <div className="absolute z-50 mt-1 left-0 min-w-[180px] rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] shadow-lg">
                        {visOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setVisibility(opt.value); setShowVisibilityDropdown(false) }}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                              visibility === opt.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleCancel} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Cancel</button>
                  {postMode === 'poll' && (
                    <Button size="sm" variant="outline" onClick={() => setShowPollPreview(!showPollPreview)}>
                      Preview
                    </Button>
                  )}
                  <Button size="sm" disabled={isPostDisabled} isLoading={createMutation.isPending} onClick={() => createMutation.mutate()}>
                    {t.feed.sharePost}
                  </Button>
                </div>
              </div>

              {postError && (
                <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{postError}</p>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3 shadow-lg">
                  <div className="flex gap-1 mb-2 overflow-x-auto">
                    {Object.keys(EMOJI_CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveEmojiCategory(cat)}
                        className={cn(
                          'rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                          activeEmojiCategory === cat ? 'bg-primary-100 text-primary-600' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {RECENT_EMOJIS.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Recently Used</p>
                      <div className="flex flex-wrap gap-1">
                        {RECENT_EMOJIS.slice(0, 8).map(emoji => (
                          <button key={emoji} onClick={() => insertEmoji(emoji)} className="rounded-md p-1.5 text-lg hover:bg-[var(--color-bg-hover)] transition-colors">{emoji}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto">
                    {(EMOJI_CATEGORIES[activeEmojiCategory] || []).map(emoji => (
                      <button key={emoji} onClick={() => insertEmoji(emoji)} className="rounded-md p-1.5 text-lg hover:bg-[var(--color-bg-hover)] transition-colors text-center">{emoji}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Media (image/video) Preview */}
              {mediaFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {mediaFiles.map(m => (
                    <div key={m.id} className="relative aspect-square overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                      {m.kind === 'image'
                        ? <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
                        : <video src={m.previewUrl} muted preload="metadata" className="h-full w-full object-cover" />}
                      <button onClick={() => removeMedia(m.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Attachment Preview */}
              {documentPreview && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-3">
                  <div className="rounded-lg bg-primary-100 p-2">
                    <FiFile size={20} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{documentPreview.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{documentPreview.size}</p>
                  </div>
                  <button onClick={removeDocument} className="rounded-lg p-1 text-[var(--color-text-muted)] hover:text-danger-500 hover:bg-danger-50">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}

              {/* Research Post Fields */}
              {postMode === 'research' && (
                <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBookOpen size={16} className="text-primary-600" />
                    <span className="text-sm font-semibold text-primary-700">Research Post</span>
                  </div>
                  <Input
                    label="Paper Title"
                    placeholder="Title of the research paper"
                    value={research.title}
                    onChange={e => setResearch(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    label="Abstract"
                    placeholder="Brief abstract of the research..."
                    value={research.abstract}
                    onChange={e => setResearch(prev => ({ ...prev, abstract: e.target.value }))}
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Authors (comma separated)"
                      placeholder="Dr. Smith, Dr. Jones"
                      value={research.authors}
                      onChange={e => setResearch(prev => ({ ...prev, authors: e.target.value }))}
                    />
                    <Input
                      label="Journal"
                      placeholder="Journal name"
                      value={research.journal}
                      onChange={e => setResearch(prev => ({ ...prev, journal: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="DOI"
                      placeholder="10.xxxx/xxxxx"
                      value={research.doi}
                      onChange={e => setResearch(prev => ({ ...prev, doi: e.target.value }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Research Area</label>
                      <select
                        value={research.researchArea}
                        onChange={e => setResearch(prev => ({ ...prev, researchArea: e.target.value }))}
                        className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select area</option>
                        {RESEARCH_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Keywords (comma separated)"
                    placeholder="cardiology, heart failure, treatment"
                    value={research.keywords}
                    onChange={e => setResearch(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">PDF Attachment</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResearchFileSelect}
                      className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] file:mr-3 file:rounded-md file:border-0 file:bg-primary-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-200"
                    />
                    {researchFile && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                        <FiFile size={14} />
                        <span>{researchFile.name} ({formatFileSize(researchFile.size)})</span>
                        <button onClick={() => setResearchFile(null)} className="text-danger-500 hover:text-danger-600"><FiX size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Poll Creation */}
              {postMode === 'poll' && !showPollPreview && (
                <div className="mt-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBarChart2 size={16} className="text-primary-600" />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Create Poll</span>
                  </div>
                  <Input
                    label="Poll Question"
                    placeholder="Ask your question..."
                    value={poll.question}
                    onChange={e => setPoll(prev => ({ ...prev, question: e.target.value }))}
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--color-text-primary)]">Options</label>
                    {poll.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-muted)] w-5">{idx + 1}.</span>
                        <Input
                          placeholder={`Option ${idx + 1}`}
                          value={option}
                          onChange={e => updatePollOption(idx, e.target.value)}
                          className="flex-1"
                        />
                        {poll.options.length > 2 && (
                          <button onClick={() => removePollOption(idx)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:text-danger-500 hover:bg-danger-50">
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {poll.options.length < 5 && (
                      <button
                        onClick={addPollOption}
                        className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
                      >
                        <FiPlus size={14} /> Add Option
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Duration"
                      options={pollDurationOptions}
                      value={poll.duration}
                      onChange={(v) => setPoll(prev => ({ ...prev, duration: v }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Anonymous Voting</label>
                      <button
                        type="button"
                        onClick={() => setPoll(prev => ({ ...prev, anonymous: !prev.anonymous }))}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          poll.anonymous ? 'bg-primary-500' : 'bg-[var(--color-bg-tertiary)]'
                        )}
                      >
                        <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', poll.anonymous ? 'translate-x-6' : 'translate-x-1')} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Poll Preview */}
              {postMode === 'poll' && showPollPreview && (
                <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Poll Preview</span>
                    <button onClick={() => setShowPollPreview(false)} className="text-xs text-primary-500 hover:text-primary-600">Edit</button>
                  </div>
                  {poll.question && <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">{poll.question}</p>}
                  <div className="space-y-2">
                    {poll.options.filter(o => o.trim()).map((option, idx) => (
                      <div key={idx} className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                        {option}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><FiClock size={12} /> {poll.duration} day{parseInt(poll.duration) > 1 ? 's' : ''}</span>
                    {poll.anonymous && <span>Anonymous voting</span>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        className="hidden"
        onChange={handleDocumentSelect}
      />
    </div>
  )
}
