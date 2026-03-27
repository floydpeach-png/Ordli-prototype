import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import {
  CalendarDays,
  FileText,
  FolderPlus,
  HelpCircle,
  Lock,
  Mail,
  Sparkles,
  Users,
  Upload,
} from 'lucide-react'

type ForWhom = 'me' | 'parents'

interface User {
  firstName: string
  lastName: string
  email: string
  forWhom: ForWhom
}

interface Note {
  id: string
  content: string
  createdAt: string
}

interface FileEntry {
  id: string
  filename: string
  addedAt: string
}

interface Folder {
  id: string
  name: string
  icon: string
  isPinned?: boolean
  isThisIsMe?: boolean
  notes: Note[]
  files: FileEntry[]
}

type Relationship =
  | 'Partner'
  | 'Parent'
  | 'Child'
  | 'Friend'
  | 'Solicitor'
  | 'Other'

interface TrustedPerson {
  name: string
  relationship: Relationship
}

type LpaStatus = 'Yes' | 'No' | 'Not sure' | ''

type PropertyStatus =
  | 'I own my home'
  | 'I own multiple properties'
  | 'I rent'
  | 'Prefer not to say'
  | ''

type EmailProvider = 'Gmail' | 'Outlook' | 'Apple Mail' | 'Other' | ''
type PasswordsKept =
  | 'In my head'
  | 'Written down'
  | 'Password manager (e.g. 1Password)'
  | 'Other'
  | ''

type InvestmentsProvider =
  | 'Vanguard'
  | 'Hargreaves Lansdown'
  | 'AJ Bell'
  | 'Nutmeg'
  | 'Other'
  | 'Not sure'

type PensionStatus = 'Yes — one' | 'Yes — multiple' | 'Not sure' | 'No' | ''

type DebtOption =
  | 'Mortgage'
  | 'Personal loan or finance'
  | 'Credit card'
  | 'None of these'

interface ThisIsMeAnswers {
  framingStartedAt?: string
  trustedPeople: TrustedPerson[]
  lpa: {
    status: LpaStatus
    attorneys: string
  }
  banks: {
    selected: string[]
    otherName: string
  }
  property: {
    status: PropertyStatus
    where: string
  }
  investments: {
    status: 'Yes' | 'No' | 'Not sure' | ''
    providers: InvestmentsProvider[]
    otherName: string
  }
  pensions: {
    status: PensionStatus
    providerName: string
  }
  debts: {
    selected: DebtOption[]
    notes: string
  }
  lifeRuns: {
    emailProvider: EmailProvider
    emailOther: string
    passwordsKept: PasswordsKept
    subscriptions: string
  }
  humanLayer: {
    hiddenAccountsOrAssets: string
    keyContactsToCall: string
    personalWishes: string
    speakToXBeforeY: string
  }
}

interface Reminder {
  id: string
  title: string
  date: string
  notes?: string
}

interface Invite {
  id: string
  name: string
  email: string
  relationship:
    | 'Partner'
    | 'Child'
    | 'Sibling'
    | 'Friend'
    | 'Solicitor'
    | 'Other'
}

interface AppState {
  user: User | null
  folders: Folder[]
  thisIsMe: {
    completed: boolean
    answers: ThisIsMeAnswers | null
  }
  reminders: Reminder[]
  invites: Invite[]
  ui: {
    welcomeSeen: boolean
    thisIsMeWizardOpened: boolean
  }
}

const STORAGE_KEY = 'ordli_app_state_v1'
const THIS_IS_ME_KEY = 'thisIsMe'

const defaultThisIsMeAnswers: ThisIsMeAnswers = {
  trustedPeople: [{ name: '', relationship: 'Partner' }],
  lpa: { status: '', attorneys: '' },
  banks: { selected: [], otherName: '' },
  property: { status: '', where: '' },
  investments: { status: '', providers: [], otherName: '' },
  pensions: { status: '', providerName: '' },
  debts: { selected: [], notes: '' },
  lifeRuns: {
    emailProvider: '',
    emailOther: '',
    passwordsKept: '',
    subscriptions: '',
  },
  humanLayer: {
    hiddenAccountsOrAssets: '',
    keyContactsToCall: '',
    personalWishes: '',
    speakToXBeforeY: '',
  },
}

const defaultFolders: Folder[] = [
  {
    id: 'this-is-me',
    name: 'This Is Me',
    icon: '📋',
    isPinned: true,
    isThisIsMe: true,
    notes: [],
    files: [],
  },
  {
    id: 'passwords',
    name: 'Passwords',
    icon: '🔐',
    notes: [],
    files: [],
  },
  {
    id: 'legal',
    name: 'Legal Docs',
    icon: '📄',
    notes: [],
    files: [],
  },
  {
    id: 'medical',
    name: 'Medical',
    icon: '🏥',
    notes: [],
    files: [],
  },
  {
    id: 'property',
    name: 'Property',
    icon: '🏠',
    notes: [],
    files: [],
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '📦',
    notes: [],
    files: [],
  },
]

function loadState(): AppState {
  if (typeof window === 'undefined') {
    return {
      user: null,
      folders: defaultFolders,
      thisIsMe: { completed: false, answers: null },
      reminders: [],
      invites: [],
      ui: { welcomeSeen: false, thisIsMeWizardOpened: false },
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const thisIsMeRaw = window.localStorage.getItem(THIS_IS_ME_KEY)
      const thisIsMeFromKey = thisIsMeRaw
        ? (JSON.parse(thisIsMeRaw) as AppState['thisIsMe'])
        : null
      return {
        user: null,
        folders: defaultFolders,
        thisIsMe: thisIsMeFromKey ?? { completed: false, answers: null },
        reminders: [],
        invites: [],
        ui: { welcomeSeen: false, thisIsMeWizardOpened: false },
      }
    }
    const parsed = JSON.parse(raw) as AppState
    const thisIsMeRaw = window.localStorage.getItem(THIS_IS_ME_KEY)
    const thisIsMeFromKey = thisIsMeRaw
      ? (JSON.parse(thisIsMeRaw) as AppState['thisIsMe'])
      : null
    return {
      folders: parsed.folders?.length ? parsed.folders : defaultFolders,
      thisIsMe:
        parsed.thisIsMe ??
        thisIsMeFromKey ??
        ({ completed: false, answers: null } as AppState['thisIsMe']),
      reminders: parsed.reminders ?? [],
      invites: parsed.invites ?? [],
      user: parsed.user ?? null,
      ui: parsed.ui ?? { welcomeSeen: false, thisIsMeWizardOpened: false },
    }
  } catch {
    return {
      user: null,
      folders: defaultFolders,
      thisIsMe: { completed: false, answers: null },
      reminders: [],
      invites: [],
      ui: { welcomeSeen: false, thisIsMeWizardOpened: false },
    }
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.localStorage.setItem(THIS_IS_ME_KEY, JSON.stringify(state.thisIsMe))
}

type TabKey =
  | 'filing'
  | 'reminders'
  | 'support'
  | 'help'
  | 'dashboard'
  | 'transactions'

function App() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <div className="min-h-screen bg-ordli-sand text-slate-900">
      <Routes>
        <Route path="/" element={<Navigate to="/me" replace />} />
        <Route path="/me" element={<LandingMe />} />
        <Route path="/parents" element={<LandingParents />} />
        <Route
          path="/signup"
          element={<SignupPage onComplete={(user) => setState((s) => ({ ...s, user }))} />}
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute user={state.user}>
              <MainApp state={state} setState={setState} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/me" replace />} />
      </Routes>
    </div>
  )
}

function ProtectedRoute({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  const location = useLocation()
  if (!user) {
    return <Navigate to="/me" replace state={{ from: location }} />
  }
  return <>{children}</>
}

function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/me" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ordli-tealSoft shadow-soft">
            <span className="text-lg font-semibold text-ordli-teal">O</span>
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight text-ordli-ink">
              Ordli
            </div>
            <p className="text-xs text-slate-500">
              One calm place for everything that matters
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/me"
            className="text-slate-600 underline-offset-4 hover:text-ordli-teal hover:underline"
          >
            For yourself
          </Link>
          <Link
            to="/parents"
            className="text-slate-600 underline-offset-4 hover:text-ordli-teal hover:underline"
          >
            For a parent
          </Link>
          <Link
            to="/signup?for=me"
            className="rounded-full bg-ordli-teal px-4 py-1.5 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
          >
            Start free
          </Link>
        </nav>
      </header>
      {children}
    </div>
  )
}

function HeroIllustration({ variant }: { variant: 'me' | 'parents' }) {
  const bg =
    variant === 'me'
      ? 'from-ordli-tealSoft via-ordli-sand to-ordli-amberSoft'
      : 'from-ordli-amberSoft via-ordli-sand to-ordli-tealSoft'

  return (
    <div
      className={`relative flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${bg} shadow-soft`}
    >
      <div className="absolute -left-6 -top-8 h-24 w-24 rounded-full bg-white/60" />
      <div className="absolute -right-6 -bottom-10 h-32 w-32 rounded-full bg-white/40" />
      <div className="relative flex items-center gap-3 rounded-2xl bg-white/90 px-5 py-3 shadow-soft">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ordli-tealSoft text-2xl">
          {variant === 'me' ? '🧺' : '👐'}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-ordli-teal">
            Gentle planning
          </p>
          <p className="text-sm text-slate-700">
            Turn scattered papers into one calm place.
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ordli-tealSoft text-ordli-teal">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-ordli-ink">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function ReassuranceStrip() {
  return (
    <div className="mt-8 rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-ordli-tealSoft md:flex md:items-center md:justify-between">
      <p className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ordli-teal" />
        <span>No bank details required.</span>
      </p>
      <p className="mt-2 text-slate-600 md:mt-0">
        Free to get started. Private, encrypted, and just for you and the people you
        invite.
      </p>
    </div>
  )
}

function LandingMe() {
  return (
    <LayoutShell>
      <main className="flex flex-col gap-10 md:flex-row md:items-center">
        <section className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-ordli-amberSoft px-3 py-1 text-xs font-medium text-ordli-ink">
            <span className="text-lg">🌱</span>
            A calm place to sort the important stuff
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-ordli-ink sm:text-4xl lg:text-5xl">
              Get your life in order. For you, and everyone who loves you.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
              Ordli gives you one calm, organised place to store everything that
              matters — documents, wishes, passwords, and plans — so nothing gets
              lost when it matters most.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup?for=me"
              className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-6 py-2.5 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
            >
              Start organising for free
            </Link>
            <p className="text-xs text-slate-600">
              Takes around 5–10 minutes to set up your first space.
            </p>
          </div>
        </section>
        <section className="flex-1">
          <HeroIllustration variant="me" />
        </section>
      </main>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Filing Cabinet"
          description="Keep passports, policies, logins and paperwork together in one warm, organised space."
          icon={<FileText className="h-5 w-5" />}
        />
        <FeatureCard
          title="Reminders & Calendar"
          description="Gently remember renewals, check-ups and little life admin before they become urgent."
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <FeatureCard
          title="Support Huddle"
          description="Invite trusted people to see what they might need one day – without sharing everything."
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      <ReassuranceStrip />

      <footer className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-600">
        <p>
          Setting this up for a parent?{' '}
          <Link
            to="/parents"
            className="font-medium text-ordli-teal underline-offset-4 hover:underline"
          >
            Go here →
          </Link>
        </p>
      </footer>
    </LayoutShell>
  )
}

function LandingParents() {
  return (
    <LayoutShell>
      <main className="flex flex-col gap-10 md:flex-row md:items-center">
        <section className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-ordli-tealSoft px-3 py-1 text-xs font-medium text-ordli-ink">
            <span className="text-lg">👪</span>
            For the people caring for their parents
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-ordli-ink sm:text-4xl lg:text-5xl">
              Help your parents get organised — before it becomes urgent.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">
              Ordli makes it easy to help someone you love store the documents,
              details and wishes that matter — all in one safe place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup?for=parents"
              className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-6 py-2.5 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
            >
              Set it up for a parent
            </Link>
            <p className="text-xs text-slate-600">
              Gently gather what their future self – and yours – will be glad to
              have to hand.
            </p>
          </div>
        </section>
        <section className="flex-1">
          <HeroIllustration variant="parents" />
        </section>
      </main>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Filing Cabinet with prompts"
          description="Helpful, pre-filled ideas so you know what to upload and where to start."
          icon={<FileText className="h-5 w-5" />}
        />
        <FeatureCard
          title="Reminders & Calendar"
          description="Keep track of renewals, appointments and gentle check‑ins without holding it all in your head."
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <FeatureCard
          title="Support Huddle"
          description="Invite siblings or family to view what’s there, so you’re not carrying it all alone."
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      <ReassuranceStrip />

      <footer className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-600">
        <p>
          Setting this up for yourself?{' '}
          <Link
            to="/me"
            className="font-medium text-ordli-teal underline-offset-4 hover:underline"
          >
            Go here →
          </Link>
        </p>
      </footer>
    </LayoutShell>
  )
}

function SignupPage({ onComplete }: { onComplete: (user: User) => void }) {
  const [search] = useSearchParams()
  const forParam = (search.get('for') as ForWhom | null) ?? 'me'
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleComplete = () => {
    const user: User = {
      firstName: firstName.trim() || 'Friend',
      lastName: lastName.trim(),
      email: email.trim(),
      forWhom: forParam,
    }
    onComplete(user)
    const fullState = loadState()
    const updated: AppState = {
      ...fullState,
      user,
      ui: { ...fullState.ui, welcomeSeen: false, thisIsMeWizardOpened: false },
    }
    saveState(updated)
    navigate('/app', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ordli-sand px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 p-6 shadow-soft ring-1 ring-slate-100 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ordli-teal">
              Step {step} of 2
            </p>
            <h1 className="mt-1 text-xl font-semibold text-ordli-ink">
              {step === 1 ? 'Create your Ordli account' : 'Almost there'}
            </h1>
          </div>
          <div className="h-2 w-28 rounded-full bg-ordli-tealSoft">
            <div
              className="h-2 rounded-full bg-ordli-teal transition-all"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {step === 1 && (
          <form className="space-y-4" onSubmit={handleAccountSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  First name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Last name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                required
                minLength={6}
              />
              <p className="mt-1 text-xs text-slate-500">
                Just for this prototype, your password lives only in your browser.
              </p>
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-ordli-teal px-4 py-2.5 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
            >
              Create my account
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-ordli-ink">
                {forParam === 'me'
                  ? `Great ${firstName || 'there'}, let's get you set up.`
                  : `Great ${firstName || 'there'}, let's get their space ready.`}
              </h2>
              <p className="text-sm text-slate-700">
                {forParam === 'me'
                  ? 'In your Ordli space you can gently gather the details, documents and wishes that will help the people you love if they ever need to step in.'
                  : 'You’ll be able to collect your parent’s important documents, details and wishes in one calm place – and invite others to see what they might need one day.'}
              </p>
            </div>
            <button
              onClick={handleComplete}
              className="inline-flex w-full items-center justify-center rounded-full bg-ordli-teal px-4 py-2.5 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
            >
              {forParam === 'me' ? 'Take me to my space' : 'Set up their space'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-slate-500 underline-offset-4 hover:underline"
            >
              Go back and edit my details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MainApp({
  state,
  setState,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('filing')
  const [activeFolderId, setActiveFolderId] = useState<string>('this-is-me')
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadSuggestion, setUploadSuggestion] = useState<null | {
    entry: FileEntry
    fromFolderId: string
    suggestedFolderId: string
    suggestedFolderName: string
    label: string
    icon: string
  }>(null)

  const user = state.user!

  useEffect(() => {
    if (!state.ui.welcomeSeen) {
      const timer = setTimeout(() => {
        setState((s) => ({
          ...s,
          ui: { ...s.ui, welcomeSeen: true },
        }))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [state.ui.welcomeSeen, setState])

  const selectedFolder = state.folders.find((f) => f.id === activeFolderId) ?? state.folders[0]

  const setFolders = (updater: (prev: Folder[]) => Folder[]) => {
    setState((s) => ({ ...s, folders: updater(s.folders) }))
  }

  const updateThisIsMe = (updater: (prev: ThisIsMeAnswers) => ThisIsMeAnswers) => {
    setState((s) => ({
      ...s,
      thisIsMe: {
        completed: true,
        answers: updater(s.thisIsMe.answers ?? defaultThisIsMeAnswers),
      },
    }))
  }

  const getSuggestionForFilename = (
    filename: string,
  ): null | { folderId: string; folderName: string; label: string; icon: string } => {
    const lower = filename.toLowerCase()
    const isPdf = lower.endsWith('.pdf')
    const isImage =
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png')

    const hasAny = (keywords: string[]) =>
      keywords.some((k) => lower.includes(k))

    if (hasAny(['will', 'testament'])) {
      return {
        folderId: 'legal',
        folderName: 'Legal Docs',
        label: 'This looks like a Will',
        icon: '📄',
      }
    }
    if (hasAny(['lpa', 'power of attorney'])) {
      return {
        folderId: 'legal',
        folderName: 'Legal Docs',
        label: 'This looks like an LPA document',
        icon: '📄',
      }
    }
    if (hasAny(['passport', 'driving'])) {
      return {
        folderId: 'this-is-me',
        folderName: 'This Is Me',
        label: 'This looks like an ID document',
        icon: '🪪',
      }
    }
    if (hasAny(['insurance', 'policy', 'cover'])) {
      return {
        folderId: 'insurance',
        folderName: 'Insurance',
        label: 'This looks like an insurance policy',
        icon: '🧾',
      }
    }
    if (hasAny(['mortgage', 'deeds', 'land registry'])) {
      return {
        folderId: 'property',
        folderName: 'Property',
        label: 'This looks like a property document',
        icon: '🏠',
      }
    }
    if (hasAny(['prescription', 'medical', 'nhs', 'hospital', 'gp'])) {
      return {
        folderId: 'medical',
        folderName: 'Medical',
        label: 'This looks like a medical document',
        icon: '🩺',
      }
    }

    if (isPdf) {
      return {
        folderId: 'legal',
        folderName: 'Legal Docs',
        label: 'This looks like a document',
        icon: '📄',
      }
    }
    if (isImage) {
      return {
        folderId: 'this-is-me',
        folderName: 'This Is Me',
        label: 'This looks like a photo or scan',
        icon: '🖼️',
      }
    }

    return null
  }

  const addFileToFolder = (folderId: string, entry: FileEntry) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, files: [entry, ...f.files] } : f,
      ),
    )
  }

  const addReminder = (rem: Reminder) => {
    setState((s) => ({ ...s, reminders: [...s.reminders, rem] }))
  }

  const addInvite = (invite: Invite) => {
    setState((s) => ({ ...s, invites: [...s.invites, invite] }))
  }

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newFolderName.trim()
    if (!name) return
    const folder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      icon: '🗂️',
      notes: [],
      files: [],
    }
    setFolders((prev) => [...prev, folder])
    setNewFolderName('')
    setShowNewFolderModal(false)
    setActiveFolderId(folder.id)
  }

  const showWelcomeModal = !state.ui.welcomeSeen

  const tabButtonClass = (tab: TabKey, locked?: boolean) =>
    `inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      activeTab === tab
        ? 'bg-ordli-teal text-ordli-sand shadow-soft'
        : 'bg-white/70 text-slate-700 ring-1 ring-slate-200 hover:bg-ordli-tealSoft hover:text-ordli-ink'
    } ${locked ? 'pl-2 pr-3' : ''}`

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ordli-tealSoft shadow-soft">
            <span className="text-lg font-semibold text-ordli-teal">O</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ordli-ink">
              Ordli
            </h1>
            <p className="text-xs text-slate-600">
              Welcome back, {user.firstName || 'friend'}.
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-xs">
          <button type="button" onClick={() => setActiveTab('filing')} className={tabButtonClass('filing')}>
            <FileText className="h-3.5 w-3.5" />
            <span>Filing Cabinet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={tabButtonClass('reminders')}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Reminders</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={tabButtonClass('support')}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Support Huddle</span>
          </button>
          <button type="button" onClick={() => setActiveTab('help')} className={tabButtonClass('help')}>
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help &amp; Guidance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={tabButtonClass('dashboard', true)}
          >
            <Lock className="h-3 w-3" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={tabButtonClass('transactions', true)}
          >
            <Lock className="h-3 w-3" />
            <span>Transactions</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 pb-10">
        {activeTab === 'filing' && (
          <>
            {selectedFolder.isThisIsMe &&
            !state.thisIsMe.completed &&
            state.ui.thisIsMeWizardOpened ? (
              <ThisIsMeFlow
                initialAnswers={state.thisIsMe.answers ?? defaultThisIsMeAnswers}
                onComplete={(finalAnswers) =>
                  setState((s) => ({
                    ...s,
                    thisIsMe: { completed: true, answers: finalAnswers },
                    ui: { ...s.ui, thisIsMeWizardOpened: false },
                  }))
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-[260px,1fr]">
                <aside className="space-y-3">
                  <div className="rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-100">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Folders
                    </p>
                    <div className="space-y-1">
                      {state.folders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => setActiveFolderId(folder.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                            folder.id === selectedFolder.id
                              ? 'bg-ordli-teal text-ordli-sand shadow-soft'
                              : 'bg-transparent text-ordli-ink hover:bg-ordli-tealSoft'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{folder.icon}</span>
                            <span>{folder.name}</span>
                          </span>
                          {folder.isThisIsMe && !state.thisIsMe.completed && (
                            <span className="rounded-full bg-ordli-amberSoft px-2 py-0.5 text-[10px] font-medium text-ordli-ink">
                              Start here
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewFolderModal(true)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ordli-teal/40 bg-ordli-tealSoft/60 px-3 py-2 text-xs font-medium text-ordli-teal hover:bg-ordli-tealSoft"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      New Folder
                    </button>
                  </div>
                  <p className="text-[11px] leading-snug text-slate-500">
                    This is just your prototype space. Everything stays on this device and
                    you can clear it any time.
                  </p>
                </aside>
                <section className="space-y-4">
                  {selectedFolder.isThisIsMe ? (
                    state.thisIsMe.completed ? (
                      <ThisIsMeCompletion
                        answers={state.thisIsMe.answers ?? defaultThisIsMeAnswers}
                        onEdit={() =>
                          setState((s) => ({
                            ...s,
                            thisIsMe: {
                              ...s.thisIsMe,
                              completed: false,
                              answers: s.thisIsMe.answers ?? defaultThisIsMeAnswers,
                            },
                            ui: { ...s.ui, thisIsMeWizardOpened: true },
                          }))
                        }
                      />
                    ) : (
                      <div className="rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-ordli-tealSoft/60">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ordli-teal">
                          This Is Me
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-ordli-ink">
                          Start here
                        </h2>
                        <p className="mt-2 text-sm text-slate-700">
                          This is a 2–3 minute guided flow that creates a clear, human snapshot
                          of your life — so someone you trust can step in if they ever need to.
                        </p>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[11px] text-slate-500">
                            No documents needed. Just what you know.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                ui: { ...s.ui, thisIsMeWizardOpened: true },
                              }))
                            }
                            className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-5 py-2 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
                          >
                            Start →
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <FolderContents
                      folder={selectedFolder}
                      onUpdateFolder={(updated) =>
                        setFolders((prev) =>
                          prev.map((f) => (f.id === updated.id ? updated : f)),
                        )
                      }
                      onUploadFile={(file) => {
                        const entry: FileEntry = {
                          id: `file-${Date.now()}`,
                          filename: file.name,
                          addedAt: new Date().toISOString(),
                        }
                        const suggestion = getSuggestionForFilename(file.name)
                        if (!suggestion) {
                          addFileToFolder(selectedFolder.id, entry)
                          return
                        }
                        setUploadSuggestion({
                          entry,
                          fromFolderId: selectedFolder.id,
                          suggestedFolderId: suggestion.folderId,
                          suggestedFolderName: suggestion.folderName,
                          label: suggestion.label,
                          icon: suggestion.icon,
                        })
                      }}
                    />
                  )}
                </section>
              </div>
            )}
          </>
        )}

        {activeTab === 'reminders' && (
          <RemindersTab reminders={state.reminders} onAddReminder={addReminder} />
        )}

        {activeTab === 'support' && (
          <SupportHuddleTab invites={state.invites} onAddInvite={addInvite} />
        )}

        {activeTab === 'help' && <HelpGuidanceTab />}

        {activeTab === 'dashboard' && <LockedDashboardPanel />}
        {activeTab === 'transactions' && <LockedTransactionsPanel />}
      </main>

      {showNewFolderModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
            <h2 className="mb-2 text-sm font-semibold text-ordli-ink">New folder</h2>
            <p className="mb-4 text-xs text-slate-600">
              Give your folder a name that will make sense to future you.
            </p>
            <form className="space-y-4" onSubmit={handleCreateFolder}>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Folder name
                </label>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
                >
                  Create folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadSuggestion && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ordli-tealSoft text-xl">
                {uploadSuggestion.icon}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ordli-ink">
                  {uploadSuggestion.label}
                </h2>
                <p className="text-[11px] text-slate-600">
                  We&apos;re just looking at the filename – no file scanning.
                </p>
              </div>
            </div>
            <p className="mb-4 text-xs text-slate-700">
              Should we save this to the{' '}
              <span className="font-semibold text-ordli-ink">
                {uploadSuggestion.suggestedFolderName}
              </span>{' '}
              folder instead?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  addFileToFolder(uploadSuggestion.fromFolderId, uploadSuggestion.entry)
                  setUploadSuggestion(null)
                }}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Keep it here
              </button>
              <button
                type="button"
                onClick={() => {
                  addFileToFolder(uploadSuggestion.suggestedFolderId, uploadSuggestion.entry)
                  setUploadSuggestion(null)
                }}
                className="rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
              >
                Yes, move it
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcomeModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-100">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ordli-tealSoft text-xl">
                🫶
              </div>
              <h2 className="text-base font-semibold text-ordli-ink">
                Welcome to Ordli, {user.firstName || 'friend'}.
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-700">
              Your space is ready. Start with “This Is Me” to gently capture the picture
              of your life that would really help the people who care about you.
            </p>
            <button
              type="button"
              onClick={() =>
                setState((s) => ({ ...s, ui: { ...s.ui, welcomeSeen: true } }))
              }
              className="inline-flex w-full items-center justify-center rounded-full bg-ordli-teal px-4 py-2.5 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
            >
              Got it – take me in
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FolderContents({
  folder,
  onUpdateFolder,
  onUploadFile,
}: {
  folder: Folder
  onUpdateFolder: (folder: Folder) => void
  onUploadFile: (file: File) => void
}) {
  const [draft, setDraft] = useState('')
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [docName, setDocName] = useState('')

  const handleSaveNote = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    const note: Note = {
      id: `note-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    onUpdateFolder({ ...folder, notes: [note, ...folder.notes] })
    setDraft('')
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onUploadFile(file)
    e.target.value = ''
  }

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault()
    const name = docName.trim()
    if (!name) return
    const entry: FileEntry = {
      id: `doc-${Date.now()}`,
      filename: name,
      addedAt: new Date().toISOString(),
    }
    onUpdateFolder({ ...folder, files: [entry, ...folder.files] })
    setDocName('')
    setShowAddDocModal(false)
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ordli-ink">
            <span className="text-xl">{folder.icon}</span>
            {folder.name}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Add notes, upload documents and keep everything for this topic together.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddDocModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ordli-amberSoft px-3 py-1.5 text-xs font-medium text-ordli-ink hover:bg-ordli-amberSoft/80"
          >
            <FileText className="h-3.5 w-3.5" />
            Add document
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ordli-tealSoft px-3 py-1.5 text-xs font-medium text-ordli-teal hover:bg-ordli-tealSoft/80">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload document</span>
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Add a note to this folder
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
            placeholder="For example: where something is kept, who to speak to, or what you’re planning to do next."
          />
          <div className="flex justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Notes here are just for you and anyone you choose to share this space
              with.
            </p>
            <button
              type="button"
              onClick={handleSaveNote}
              className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
            >
              Save note
            </button>
          </div>
        </div>
        <div className="space-y-3 rounded-xl bg-slate-50/80 p-3">
          <h3 className="text-xs font-semibold text-slate-700">Uploaded documents</h3>
          {folder.files.length === 0 ? (
            <p className="text-xs text-slate-500">
              No documents yet — when you add them, you’ll see the filenames here as a
              little index of what lives in this folder.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-700">
              {folder.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-ordli-teal" />
                    {file.filename}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(file.addedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="space-y-2 pt-3">
        <h3 className="text-xs font-semibold text-slate-700">Saved notes</h3>
        {folder.notes.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            No notes yet — add your first one to capture what future you or your
            family will be glad to know.
          </p>
        ) : (
          <ul className="space-y-2">
            {folder.notes.map((note) => (
              <li key={note.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="mb-1 text-[11px] text-slate-500">
                  Saved {new Date(note.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {note.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddDocModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
            <h2 className="mb-2 text-sm font-semibold text-ordli-ink">
              Add a document (no file)
            </h2>
            <p className="mb-4 text-xs text-slate-600">
              If you don&apos;t have the file to hand, you can still add a placeholder
              entry. Future you will thank you.
            </p>
            <form className="space-y-4" onSubmit={handleAddDoc}>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Document name
                </label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                  placeholder="For example: Car insurance policy (renewal pack)"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDocModal(false)
                    setDocName('')
                  }}
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
                >
                  Add it
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryItem({
  label,
  value,
  allowMultiline,
}: {
  label: string
  value: string | null | undefined
  allowMultiline?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <dt className="w-32 flex-shrink-0 text-[11px] font-medium text-slate-500">
        {label}
      </dt>
      <dd
        className={`text-[11px] text-slate-800 ${
          allowMultiline ? 'whitespace-pre-wrap' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function PillGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            value === opt.id
              ? 'bg-ordli-teal text-ordli-sand'
              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-ordli-tealSoft'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ChipGrid<T extends string>({
  selected,
  options,
  onToggle,
}: {
  selected: T[]
  options: { id: T; label: string }[]
  onToggle: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-ordli-teal text-ordli-sand shadow-soft'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-ordli-tealSoft'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ThisIsMeFlow({
  initialAnswers,
  onComplete,
}: {
  initialAnswers: ThisIsMeAnswers
  onComplete: (answers: ThisIsMeAnswers) => void
}) {
  const [screen, setScreen] = useState(1)
  const totalScreens = 11 // 10 screens + completion
  const [answers, setAnswers] = useState<ThisIsMeAnswers>(() => ({
    ...defaultThisIsMeAnswers,
    ...initialAnswers,
  }))

  useEffect(() => {
    setAnswers((prev) => ({ ...prev, ...initialAnswers }))
  }, [initialAnswers])

  const progressPct = Math.min(100, (screen / totalScreens) * 100)

  const goNext = () => setScreen((s) => Math.min(totalScreens, s + 1))
  const goBack = () => setScreen((s) => Math.max(1, s - 1))

  const canGoBack = screen > 1 && screen < totalScreens

  const finish = () => {
    onComplete(answers)
    setScreen(totalScreens)
  }

  const banksOptions = [
    'Barclays',
    'HSBC',
    'Lloyds',
    'NatWest',
    'Santander',
    'Monzo',
    'Starling',
    'Halifax',
    'Other',
  ] as const

  const investmentsOptions: InvestmentsProvider[] = [
    'Vanguard',
    'Hargreaves Lansdown',
    'AJ Bell',
    'Nutmeg',
    'Other',
    'Not sure',
  ]

  const debtOptions: DebtOption[] = [
    'Mortgage',
    'Personal loan or finance',
    'Credit card',
    'None of these',
  ]

  const isOwnsProperty =
    answers.property.status === 'I own my home' ||
    answers.property.status === 'I own multiple properties'

  const showInvestmentsProviders = answers.investments.status === 'Yes'
  const showPensionProvider =
    answers.pensions.status === 'Yes — one' || answers.pensions.status === 'Yes — multiple'

  const completion = useMemo(() => {
    const completedItems: string[] = []
    const gaps: string[] = []

    const trustedNamed = answers.trustedPeople.some((p) => p.name.trim())
    if (trustedNamed) completedItems.push('Trusted people named')

    if (answers.lpa.status) completedItems.push('LPA status captured')
    if (answers.lpa.status === 'No') gaps.push('No LPA in place')
    if (answers.lpa.status === 'Not sure') gaps.push('LPA status unclear')

    if (answers.banks.selected.length > 0) completedItems.push('Banking footprint saved')
    if (answers.banks.selected.length === 0) gaps.push('No banks listed')

    if (answers.property.status) completedItems.push('Property status saved')
    if (!answers.property.status) gaps.push('Property status not captured')

    if (answers.investments.status) completedItems.push('Savings & investments saved')
    if (answers.investments.status === 'Yes' && answers.investments.providers.length === 0) {
      gaps.push('Investment providers unknown')
    }

    if (answers.pensions.status) completedItems.push('Pension status saved')
    if (showPensionProvider && !answers.pensions.providerName.trim()) {
      gaps.push('Pension provider unknown')
    }

    if (answers.debts.selected.length > 0) completedItems.push('Debts & obligations noted')
    if (answers.lifeRuns.emailProvider) completedItems.push('How your life runs captured')

    const humanAny =
      answers.humanLayer.hiddenAccountsOrAssets.trim() ||
      answers.humanLayer.keyContactsToCall.trim() ||
      answers.humanLayer.personalWishes.trim() ||
      answers.humanLayer.speakToXBeforeY.trim()
    if (humanAny) completedItems.push('Human layer added')

    return { completedItems, gaps }
  }, [answers, showPensionProvider])

  const wrap = (content: React.ReactNode) => (
    <div className="mx-auto w-full max-w-3xl px-2 sm:px-0">
      <div className="rounded-3xl bg-white/95 p-6 shadow-soft ring-1 ring-slate-100 sm:p-8">
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ordli-teal">
              This Is Me
            </p>
            <p className="text-[11px] text-slate-500">
              Step {Math.min(screen, totalScreens)} of {totalScreens}
            </p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-ordli-tealSoft">
            <div
              className="h-2 rounded-full bg-ordli-teal transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        {content}
        {screen < totalScreens && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              Back
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-slate-500 sm:inline">
                You can edit this any time.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (screen === 10) finish()
                  else goNext()
                }}
                className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-5 py-2 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
              >
                {screen === 1 ? 'Start →' : screen === 10 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (screen === 1) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-2 py-10 text-center sm:px-0">
        <div className="w-full rounded-3xl bg-white/95 p-8 shadow-soft ring-1 ring-slate-100">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ordli-ink sm:text-3xl">
            If something happened to you, could someone step in and manage things?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-700">
            This takes 2–3 minutes. No documents needed — just what you know.
          </p>
          <div className="mx-auto mt-6 h-2 w-full max-w-md rounded-full bg-ordli-tealSoft">
            <div className="h-2 w-[9%] rounded-full bg-ordli-teal" />
          </div>
          <button
            type="button"
            onClick={() => {
              setAnswers((a) => ({
                ...a,
                framingStartedAt: a.framingStartedAt ?? new Date().toISOString(),
              }))
              goNext()
            }}
            className="mt-7 inline-flex items-center justify-center rounded-full bg-ordli-teal px-7 py-3 text-sm font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
          >
            Start →
          </button>
        </div>
      </div>
    )
  }

  if (screen === totalScreens) {
    return wrap(
      <div className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-ordli-ink">
            You&apos;ve made things much easier for the people around you.
          </h2>
          <p className="text-sm text-slate-700">
            This is a simple readiness snapshot — it doesn&apos;t need to be perfect to be
            genuinely helpful.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-ordli-ink">Readiness Summary</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-semibold text-slate-700">✅ Completed</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {completion.completedItems.length === 0 ? (
                  <li className="text-slate-500">
                    You haven&apos;t added anything yet — that&apos;s okay. Start with just one
                    screen and you’ll feel it click.
                  </li>
                ) : (
                  completion.completedItems.map((item) => <li key={item}>• {item}</li>)
                )}
              </ul>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-semibold text-slate-700">⚠️ Gaps to revisit</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {completion.gaps.length === 0 ? (
                  <li className="text-slate-500">
                    No obvious gaps flagged — lovely. You can still add more detail
                    whenever you like.
                  </li>
                ) : (
                  completion.gaps.map((gap) => <li key={gap}>• {gap}</li>)
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-ordli-amberSoft p-4 ring-1 ring-ordli-amber/30">
          <h3 className="text-sm font-semibold text-ordli-ink">
            Want to make this more legally watertight?
          </h3>
          <p className="mt-1 text-xs text-slate-700">
            Setting up a Lasting Power of Attorney is one of the most important things
            you can do. We can point you in the right direction.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ordli-teal ring-1 ring-ordli-teal/20 hover:bg-slate-50"
          >
            Learn more about LPAs →
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            Your answers are saved on this device (localStorage) under <span className="font-semibold">thisIsMe</span>.
          </p>
          <button
            type="button"
            onClick={() => setScreen(2)}
            className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-5 py-2 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
          >
            Edit my answers
          </button>
        </div>
      </div>,
    )
  }

  if (screen === 2) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Who Takes Over?</h2>
          <p className="text-sm text-slate-700">
            Who would you trust to handle things if you couldn&apos;t?
          </p>
        </div>
        <div className="space-y-3">
          {answers.trustedPeople.map((p, idx) => (
            <div key={idx} className="grid gap-2 rounded-2xl bg-slate-50/80 p-3 sm:grid-cols-[1fr,200px]">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Name</label>
                <input
                  value={p.name}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      trustedPeople: a.trustedPeople.map((row, i) =>
                        i === idx ? { ...row, name: e.target.value } : row,
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                  placeholder="For example: Jo Carter"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Relationship</label>
                <select
                  value={p.relationship}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      trustedPeople: a.trustedPeople.map((row, i) =>
                        i === idx
                          ? { ...row, relationship: e.target.value as Relationship }
                          : row,
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                >
                  {['Partner', 'Parent', 'Child', 'Friend', 'Solicitor', 'Other'].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setAnswers((a) => ({
                ...a,
                trustedPeople: [...a.trustedPeople, { name: '', relationship: 'Friend' }],
              }))
            }
            className="text-left text-xs font-medium text-ordli-teal underline-offset-4 hover:underline"
          >
            + Add another person
          </button>
        </div>
      </div>,
    )
  }

  if (screen === 3) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Legal readiness (LPA)</h2>
          <p className="text-sm text-slate-700">
            Do you have a Lasting Power of Attorney in place?
          </p>
        </div>
        <PillGroup<LpaStatus>
          value={answers.lpa.status}
          options={[
            { id: 'Yes', label: 'Yes' },
            { id: 'No', label: 'No' },
            { id: 'Not sure', label: 'Not sure' },
            { id: '', label: 'Skip for now' },
          ]}
          onChange={(v) => setAnswers((a) => ({ ...a, lpa: { ...a.lpa, status: v } }))}
        />
        {answers.lpa.status === 'Yes' && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Who have you named as your attorney(s)?
            </label>
            <input
              value={answers.lpa.attorneys}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, lpa: { ...a.lpa, attorneys: e.target.value } }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
              placeholder="Names are enough here."
            />
          </div>
        )}
      </div>,
    )
  }

  if (screen === 4) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Banking footprint</h2>
          <p className="text-sm text-slate-700">Which banks do you use?</p>
        </div>
        <ChipGrid<string>
          selected={answers.banks.selected}
          options={banksOptions.map((b) => ({ id: b, label: b }))}
          onToggle={(id) =>
            setAnswers((a) => {
              const selected = a.banks.selected.includes(id)
                ? a.banks.selected.filter((x) => x !== id)
                : [...a.banks.selected, id]
              return { ...a, banks: { ...a.banks, selected } }
            })
          }
        />
        {answers.banks.selected.includes('Other') && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Other bank name
            </label>
            <input
              value={answers.banks.otherName}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, banks: { ...a.banks, otherName: e.target.value } }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
              placeholder="For example: Nationwide"
            />
          </div>
        )}
        <p className="text-[11px] text-slate-500">
          Don&apos;t worry about account details — just where money is held.
        </p>
      </div>,
    )
  }

  if (screen === 5) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Property</h2>
          <p className="text-sm text-slate-700">Do you own any property?</p>
        </div>
        <PillGroup<PropertyStatus>
          value={answers.property.status}
          options={[
            { id: 'I own my home', label: 'I own my home' },
            { id: 'I own multiple properties', label: 'I own multiple properties' },
            { id: 'I rent', label: 'I rent' },
            { id: 'Prefer not to say', label: 'Prefer not to say' },
            { id: '', label: 'Skip for now' },
          ]}
          onChange={(v) => setAnswers((a) => ({ ...a, property: { ...a.property, status: v } }))}
        />
        {isOwnsProperty && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Roughly where is it? (city or town is fine)
            </label>
            <input
              value={answers.property.where}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, property: { ...a.property, where: e.target.value } }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
              placeholder="For example: Bristol"
            />
          </div>
        )}
      </div>,
    )
  }

  if (screen === 6) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Savings &amp; investments</h2>
          <p className="text-sm text-slate-700">Do you have savings, ISAs, or investments?</p>
        </div>
        <PillGroup<ThisIsMeAnswers['investments']['status']>
          value={answers.investments.status}
          options={[
            { id: 'Yes', label: 'Yes' },
            { id: 'No', label: 'No' },
            { id: 'Not sure', label: 'Not sure' },
            { id: '', label: 'Skip for now' },
          ]}
          onChange={(v) => setAnswers((a) => ({ ...a, investments: { ...a.investments, status: v } }))}
        />
        {showInvestmentsProviders && (
          <>
            <ChipGrid<InvestmentsProvider>
              selected={answers.investments.providers}
              options={investmentsOptions.map((p) => ({ id: p, label: p }))}
              onToggle={(id) =>
                setAnswers((a) => {
                  const selected = a.investments.providers.includes(id)
                    ? a.investments.providers.filter((x) => x !== id)
                    : [...a.investments.providers, id]
                  return { ...a, investments: { ...a.investments, providers: selected } }
                })
              }
            />
            {answers.investments.providers.includes('Other') && (
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Other provider name
                </label>
                <input
                  value={answers.investments.otherName}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      investments: { ...a.investments, otherName: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                />
              </div>
            )}
          </>
        )}
        <p className="text-[11px] text-slate-500">Even a rough idea helps.</p>
      </div>,
    )
  }

  if (screen === 7) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Pensions</h2>
          <p className="text-sm text-slate-700">Do you have a pension?</p>
        </div>
        <PillGroup<PensionStatus>
          value={answers.pensions.status}
          options={[
            { id: 'Yes — one', label: 'Yes — one' },
            { id: 'Yes — multiple', label: 'Yes — multiple' },
            { id: 'Not sure', label: 'Not sure' },
            { id: 'No', label: 'No' },
            { id: '', label: 'Skip for now' },
          ]}
          onChange={(v) => setAnswers((a) => ({ ...a, pensions: { ...a.pensions, status: v } }))}
        />
        {showPensionProvider && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Any idea who they&apos;re with? (pension provider name)
            </label>
            <input
              value={answers.pensions.providerName}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  pensions: { ...a.pensions, providerName: e.target.value },
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
              placeholder="For example: Aviva"
            />
          </div>
        )}
      </div>,
    )
  }

  if (screen === 8) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">Debts &amp; obligations</h2>
          <p className="text-sm text-slate-700">Do you have any of the following?</p>
        </div>
        <ChipGrid<DebtOption>
          selected={answers.debts.selected}
          options={debtOptions.map((d) => ({ id: d, label: d }))}
          onToggle={(id) =>
            setAnswers((a) => {
              let selected = a.debts.selected.includes(id)
                ? a.debts.selected.filter((x) => x !== id)
                : [...a.debts.selected, id]
              if (id !== 'None of these' && selected.includes('None of these')) {
                selected = selected.filter((x) => x !== 'None of these')
              }
              if (id === 'None of these') {
                selected = ['None of these']
              }
              return { ...a, debts: { ...a.debts, selected } }
            })
          }
        />
        <div className="mt-2">
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Anything important someone should know? (optional)
          </label>
          <input
            value={answers.debts.notes}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, debts: { ...a.debts, notes: e.target.value } }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
            placeholder="For example: payments come out on the 1st"
          />
        </div>
      </div>,
    )
  }

  if (screen === 9) {
    return wrap(
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ordli-ink">How your life runs</h2>
          <p className="text-sm text-slate-700">
            If someone had to step in, where would they start?
          </p>
        </div>

        <div className="space-y-4 rounded-2xl bg-slate-50/80 p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Main email provider</p>
            <PillGroup<EmailProvider>
              value={answers.lifeRuns.emailProvider}
              options={[
                { id: 'Gmail', label: 'Gmail' },
                { id: 'Outlook', label: 'Outlook' },
                { id: 'Apple Mail', label: 'Apple Mail' },
                { id: 'Other', label: 'Other' },
                { id: '', label: 'Skip for now' },
              ]}
              onChange={(v) =>
                setAnswers((a) => ({
                  ...a,
                  lifeRuns: { ...a.lifeRuns, emailProvider: v },
                }))
              }
            />
            {answers.lifeRuns.emailProvider === 'Other' && (
              <input
                value={answers.lifeRuns.emailOther}
                onChange={(e) =>
                  setAnswers((a) => ({
                    ...a,
                    lifeRuns: { ...a.lifeRuns, emailOther: e.target.value },
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                placeholder="Email provider name"
              />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Where are your passwords kept?</p>
            <PillGroup<PasswordsKept>
              value={answers.lifeRuns.passwordsKept}
              options={[
                { id: 'In my head', label: 'In my head' },
                { id: 'Written down', label: 'Written down' },
                { id: 'Password manager (e.g. 1Password)', label: 'Password manager (e.g. 1Password)' },
                { id: 'Other', label: 'Other' },
                { id: '', label: 'Skip for now' },
              ]}
              onChange={(v) =>
                setAnswers((a) => ({
                  ...a,
                  lifeRuns: { ...a.lifeRuns, passwordsKept: v },
                }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Any important subscriptions or regular bills? (optional)
            </label>
            <textarea
              value={answers.lifeRuns.subscriptions}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  lifeRuns: { ...a.lifeRuns, subscriptions: e.target.value },
                }))
              }
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
              placeholder="Streaming, utilities, rent/mortgage, memberships… anything someone would need to keep running."
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          This is what makes things manageable day-to-day.
        </p>
      </div>,
    )
  }

  // screen === 10
  const prompts = [
    { key: 'hiddenAccountsOrAssets', title: 'Hidden accounts or assets', hint: 'Anything someone might not find easily.' },
    { key: 'keyContactsToCall', title: 'Key contacts to call', hint: 'Family, a neighbour, solicitor, accountant…' },
    { key: 'personalWishes', title: 'Personal wishes', hint: 'Anything you’d want respected.' },
    { key: 'speakToXBeforeY', title: '"Speak to X before doing Y" instructions', hint: 'Little guardrails that avoid mistakes.' },
  ] as const

  return wrap(
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-ordli-ink">Final human layer</h2>
        <p className="text-sm text-slate-700">
          Anything people wouldn&apos;t know, but should?
        </p>
      </div>
      <div className="space-y-3">
        {prompts.map((p) => {
          const value = (answers.humanLayer as any)[p.key] as string
          const expanded = value.length > 0
          return (
            <details
              key={p.key}
              className="group rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100 open:bg-white"
              open={expanded}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ordli-ink">{p.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{p.hint}</p>
                  </div>
                  <span className="rounded-full bg-ordli-tealSoft px-2 py-0.5 text-[10px] font-semibold text-ordli-teal">
                    Optional
                  </span>
                </div>
              </summary>
              <div className="mt-3">
                <textarea
                  value={value}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      humanLayer: { ...a.humanLayer, [p.key]: e.target.value } as any,
                    }))
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                  placeholder="Add anything you’d want someone to know."
                />
              </div>
            </details>
          )
        })}
      </div>
    </div>,
  )
}

function ThisIsMeCompletion({
  answers,
  onEdit,
}: {
  answers: ThisIsMeAnswers
  onEdit: () => void
}) {
  const completion = useMemo(() => {
    const completedItems: string[] = []
    const gaps: string[] = []
    const trustedNamed = answers.trustedPeople.some((p) => p.name.trim())
    if (trustedNamed) completedItems.push('Trusted people named')

    if (answers.banks.selected.length > 0) completedItems.push('Banking footprint saved')

    if (answers.lpa.status) completedItems.push('LPA status captured')
    if (answers.lpa.status === 'No') gaps.push('No LPA in place')
    if (answers.lpa.status === 'Not sure') gaps.push('LPA status unclear')

    const showPensionProvider =
      answers.pensions.status === 'Yes — one' || answers.pensions.status === 'Yes — multiple'
    if (answers.pensions.status) completedItems.push('Pension status saved')
    if (showPensionProvider && !answers.pensions.providerName.trim()) {
      gaps.push('Pension provider unknown')
    }

    if (answers.investments.status) completedItems.push('Savings & investments saved')
    if (answers.investments.status === 'Yes' && answers.investments.providers.length === 0) {
      gaps.push('Investment providers unknown')
    }

    if (answers.lifeRuns.emailProvider) completedItems.push('How your life runs captured')
    if (answers.debts.selected.length > 0) completedItems.push('Debts & obligations noted')

    return { completedItems, gaps }
  }, [answers])

  return (
    <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-ordli-tealSoft/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ordli-teal">
            This Is Me
          </p>
          <h2 className="mt-1 text-base font-semibold text-ordli-ink">
            You&apos;ve made things much easier for the people around you.
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            A small, kind snapshot – saved to this device. You can edit it any time.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="hidden rounded-full bg-ordli-tealSoft px-3 py-1.5 text-xs font-medium text-ordli-teal hover:bg-ordli-tealSoft/80 sm:inline-flex"
        >
          Edit my answers
        </button>
      </div>

      <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
        <h3 className="text-sm font-semibold text-ordli-ink">Readiness Summary</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-700">✅ Completed</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {completion.completedItems.length === 0 ? (
                <li className="text-slate-500">No items yet.</li>
              ) : (
                completion.completedItems.map((item) => <li key={item}>• {item}</li>)
              )}
            </ul>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-700">⚠️ Gaps to revisit</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {completion.gaps.length === 0 ? (
                <li className="text-slate-500">No gaps flagged.</li>
              ) : (
                completion.gaps.map((gap) => <li key={gap}>• {gap}</li>)
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-ordli-amberSoft p-4 ring-1 ring-ordli-amber/30">
        <h3 className="text-sm font-semibold text-ordli-ink">
          Want to make this more legally watertight?
        </h3>
        <p className="mt-1 text-xs text-slate-700">
          Setting up a Lasting Power of Attorney is one of the most important things you
          can do. We can point you in the right direction.
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ordli-teal ring-1 ring-ordli-teal/20 hover:bg-slate-50"
        >
          Learn more about LPAs →
        </button>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-500">
          Saved on this device under <span className="font-semibold">thisIsMe</span>.
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
        >
          Edit my answers
        </button>
      </div>
    </div>
  )
}

function RemindersTab({
  reminders,
  onAddReminder,
}: {
  reminders: Reminder[]
  onAddReminder: (rem: Reminder) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )

  const remindersByDate = useMemo(() => {
    const map: Record<string, Reminder[]> = {}
    reminders.forEach((r) => {
      map[r.date] = map[r.date] || []
      map[r.date].push(r)
    })
    return map
  }, [reminders])

  const upcoming = useMemo(
    () =>
      [...reminders]
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter((r) => r.date >= today.toISOString().slice(0, 10))
        .slice(0, 5),
    [reminders, today],
  )

  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  )
  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  )
  const startWeekday = startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay()
  const daysInMonth = endOfMonth.getDate()

  const cells: { day: number | null; dateStr?: string }[] = []
  for (let i = 1; i < startWeekday; i++) {
    cells.push({ day: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      d,
    )
    const dateStr = dateObj.toISOString().slice(0, 10)
    cells.push({ day: d, dateStr })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    const reminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      date,
      notes: notes.trim() || undefined,
    }
    onAddReminder(reminder)
    setTitle('')
    setDate('')
    setNotes('')
    setShowModal(false)
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ordli-ink">
            <CalendarDays className="h-4 w-4 text-ordli-teal" />
            Reminders
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            A gentle calendar for renewals, check‑ups and little pieces of life admin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
        >
          Add reminder
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <div className="rounded-xl bg-slate-50/80 p-3">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-700">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              ‹
            </button>
            <div className="font-medium">
              {currentMonth.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1 text-[11px]">
            {cells.map((cell, idx) => {
              if (cell.day === null) {
                return <div key={idx} className="h-8 rounded-lg" />
              }
              const hasRem = cell.dateStr && remindersByDate[cell.dateStr]
              const isToday =
                cell.dateStr === today.toISOString().slice(0, 10)
              return (
                <div
                  key={idx}
                  className={`flex h-8 flex-col items-center justify-center rounded-lg border text-slate-700 ${
                    isToday
                      ? 'border-ordli-teal bg-ordli-tealSoft font-semibold'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <span>{cell.day}</span>
                  {hasRem && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-ordli-amber" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-xl bg-slate-50/80 p-3">
          <h3 className="text-xs font-semibold text-ordli-ink">
            Upcoming reminders
          </h3>
          {upcoming.length === 0 ? (
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
              No reminders yet — add your first one for something you’d like future you
              (or your family) to remember in good time.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {upcoming.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-ordli-ink">{r.title}</p>
                    <span className="text-[11px] text-slate-500">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="mt-1 text-[11px] text-slate-600">{r.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
            <h2 className="mb-2 text-sm font-semibold text-ordli-ink">
              Add a reminder
            </h2>
            <p className="mb-3 text-xs text-slate-600">
              Think about things like renewals, check‑ups or gentle check‑ins that your
              future self will appreciate.
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:bg-white focus:ring-2"
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
                >
                  Save reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SupportHuddleTab({
  invites,
  onAddInvite,
}: {
  invites: Invite[]
  onAddInvite: (invite: Invite) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] =
    useState<Invite['relationship']>('Partner')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    const invite: Invite = {
      id: `inv-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      relationship,
    }
    onAddInvite(invite)
    setName('')
    setEmail('')
    setRelationship('Partner')
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ordli-ink">
            <Users className="h-4 w-4 text-ordli-teal" />
            Your Support Huddle
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Invite trusted people — family, friends, a solicitor — to have a read‑only
            view of your Ordli space.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <form className="space-y-3 rounded-xl bg-slate-50/80 p-3" onSubmit={handleSubmit}>
          <h3 className="text-xs font-semibold text-ordli-ink">Invite someone</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Relationship
            </label>
            <select
              value={relationship}
              onChange={(e) =>
                setRelationship(e.target.value as Invite['relationship'])
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-ordli-amber/40 focus:ring-2"
            >
              {['Partner', 'Child', 'Sibling', 'Friend', 'Solicitor', 'Other'].map(
                (opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ),
              )}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Send invite
          </button>
          <p className="mt-1 text-[11px] text-slate-500">
            In this prototype, invites don&apos;t actually send — but this is exactly how
            it will feel.
          </p>
        </form>

        <div className="space-y-2 rounded-xl bg-slate-50/80 p-3">
          <h3 className="text-xs font-semibold text-ordli-ink">
            Sent invites (prototype)
          </h3>
          {invites.length === 0 ? (
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
              No invites yet — add someone you trust so they know this space exists and
              can see what you choose to share.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
                >
                  <div>
                    <p className="font-medium text-ordli-ink">
                      {inv.name}{' '}
                      <span className="text-[11px] text-slate-500">
                        · {inv.relationship}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">{inv.email}</p>
                  </div>
                  <span className="rounded-full bg-ordli-amberSoft px-2 py-0.5 text-[10px] font-semibold text-ordli-ink">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            In the full version, invitees receive an email and can log in to view your
            shared space with read‑only access.
          </p>
        </div>
      </div>
    </div>
  )
}

function HelpGuidanceTab() {
  const articleCards = [
    {
      title: 'What is a Lasting Power of Attorney and do I need one?',
      category: 'Legal',
      description:
        'A plain‑English guide to what LPAs are, how they work, and how to decide whether now is the right time to set one up.',
    },
    {
      title:
        'How to have the conversation about later life planning with your parents',
      category: 'Family',
      description:
        'Gentle scripts and ideas for opening up the conversation without feeling gloomy, bossy or overwhelming.',
    },
    {
      title: 'A simple checklist: What to organise before it’s urgent',
      category: 'Planning',
      description:
        'A practical list you can work through over a few cups of tea, not a single stressful weekend.',
    },
  ]

  const videoCards = [
    {
      title: 'Getting started with Ordli',
      duration: '3 min',
    },
    {
      title: 'Understanding Lasting Powers of Attorney',
      duration: '5 min',
    },
  ]

  return (
    <div className="space-y-5 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-slate-100">
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ordli-ink">
          <HelpCircle className="h-4 w-4 text-ordli-teal" />
          Help &amp; Guidance
        </h2>
        <p className="text-xs text-slate-600">
          Friendly resources to help you make sense of the practical and emotional
          side of getting things in order.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-ordli-ink">Articles</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {articleCards.map((a) => (
            <article
              key={a.title}
              className="flex flex-col justify-between rounded-2xl bg-slate-50/80 p-3 text-xs shadow-sm ring-1 ring-slate-100"
            >
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-ordli-amberSoft px-2 py-0.5 text-[10px] font-semibold text-ordli-ink">
                  {a.category}
                </span>
                <h4 className="text-sm font-semibold text-ordli-ink">{a.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-3">
                  {a.description}
                </p>
              </div>
              <button
                type="button"
                className="mt-3 inline-flex items-center text-[11px] font-medium text-ordli-teal underline-offset-4 hover:underline"
              >
                Read more →
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-ordli-ink">Videos</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {videoCards.map((v) => (
            <div
              key={v.title}
              className="flex gap-3 rounded-2xl bg-slate-50/80 p-3 text-xs shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex h-20 w-28 items-center justify-center rounded-xl bg-slate-200/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-[11px] text-white">
                  ▶
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-ordli-ink">
                    {v.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Short, friendly walkthrough · {v.duration}
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 inline-flex w-max items-center text-[11px] font-medium text-ordli-teal underline-offset-4 hover:underline"
                >
                  Watch placeholder →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function LockedDashboardPanel() {
  return (
    <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ordli-ink">
            <Lock className="h-4 w-4 text-ordli-teal" />
            Your Financial Dashboard
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            See all your connected accounts in one place — balances, monthly spend,
            income, and a downloadable report for any period.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
        >
          Unlock with Ordli Plus →
        </button>
      </div>
      <div className="relative mt-2 overflow-hidden rounded-2xl bg-slate-100/80 p-4">
        <div className="pointer-events-none absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
        <div className="relative grid gap-4 md:grid-cols-3">
          <div className="space-y-1 rounded-xl bg-white/70 p-3 text-xs text-slate-700">
            <p className="text-[11px] text-slate-500">Total balance</p>
            <p className="text-lg font-semibold tracking-tight">£82,430</p>
            <p className="text-[11px] text-emerald-600">+£520 this month</p>
          </div>
          <div className="space-y-1 rounded-xl bg-white/70 p-3 text-xs text-slate-700">
            <p className="text-[11px] text-slate-500">Monthly spend</p>
            <p className="text-lg font-semibold tracking-tight">£2,140</p>
            <p className="text-[11px] text-slate-500">Across 3 accounts</p>
          </div>
          <div className="space-y-1 rounded-xl bg-white/70 p-3 text-xs text-slate-700">
            <p className="text-[11px] text-slate-500">Income this month</p>
            <p className="text-lg font-semibold tracking-tight">£2,760</p>
            <p className="text-[11px] text-emerald-600">Salary + pension</p>
          </div>
          <div className="md:col-span-3">
            <div className="h-24 rounded-xl bg-gradient-to-r from-ordli-tealSoft via-ordli-amberSoft to-slate-100 opacity-80" />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        This feature is part of Ordli Plus. When it&apos;s ready, you&apos;ll be able to
        securely connect your bank accounts and download simple, human‑readable
        reports.
      </p>
    </div>
  )
}

function LockedTransactionsPanel() {
  return (
    <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-soft ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ordli-ink">
            <Lock className="h-4 w-4 text-ordli-teal" />
            Your Transactions
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Every transaction from every connected account, in one list. Filter by
            date, category or account.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-ordli-teal px-4 py-1.5 text-xs font-semibold text-ordli-sand shadow-soft hover:bg-teal-800"
        >
          Unlock with Ordli Plus →
        </button>
      </div>
      <div className="relative mt-2 overflow-hidden rounded-2xl bg-slate-100/80 p-4">
        <div className="pointer-events-none absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
        <div className="relative space-y-2 text-xs text-slate-700">
          <div className="flex justify-between rounded-lg bg-white/80 px-3 py-2">
            <span>Groceries · Planet Co‑op</span>
            <span>-£64.20</span>
          </div>
          <div className="flex justify-between rounded-lg bg-white/80 px-3 py-2">
            <span>Energy · GreenSpark</span>
            <span>-£92.10</span>
          </div>
          <div className="flex justify-between rounded-lg bg-white/80 px-3 py-2">
            <span>Pension · Evergreen</span>
            <span>+£640.00</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        This feature is part of Ordli Plus. It&apos;s designed to give you a calm,
        birds‑eye view of what&apos;s going in and out without any overwhelm.
      </p>
    </div>
  )
}

export default App
