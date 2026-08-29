import { useEffect, useState, useRef } from 'react'
import './App.css'

const getTodayKST = () => {
  const now = new Date()
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

const getTodayDisplayKST = () => {
  const now = new Date()
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long' }).format(now)
}

const triggerHaptic = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(40);
  }
}

type TodoPriority = 'high' | 'normal' | 'low'
type Todo = { id: number; text: string; date: string; time: string; priority: TodoPriority; completed: boolean }
type Schedule = { id: number; title: string; date: string; time: string }
type Memo = { id: number; title: string; content: string; date: string }
type ExpenseType = 'income' | 'expense'
type Expense = { id: number; amount: number; description: string; type: ExpenseType; date: string }
type Diary = { id: number; date: string; content: string; photo: string | null }
type Subscription = { id: number; name: string; amount: number; billingDay: number }
type Launcher = { id: number; name: string; url: string }

const priorityOrder: Record<TodoPriority, number> = { high: 0, normal: 1, low: 2 }

const sortTodos = (items: Todo[]) => {
  return [...items].sort((a, b) => {
    const priorityDifference = priorityOrder[a.priority ?? 'normal'] - priorityOrder[b.priority ?? 'normal']
    if (priorityDifference !== 0) return priorityDifference
    const dateDifference = a.date.localeCompare(b.date)
    if (dateDifference !== 0) return dateDifference
    return a.text.localeCompare(b.text)
  })
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isFading, setIsFading] = useState(false)

  const [savedPin, setSavedPin] = useState<string>(() => localStorage.getItem('myos-pin') || '')
  const [isLocked, setIsLocked] = useState<boolean>(() => !!localStorage.getItem('myos-pin'))
  const [inputPin, setInputPin] = useState('')
  const [setupPin, setSetupPin] = useState('')

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2200) 
    const removeTimer = setTimeout(() => setIsLoading(false), 3200) 
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer) }
  }, [])

  const [showMenu, setShowMenu] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  
  const [showHelp, setShowHelp] = useState(false)
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null)

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('myos-dark-mode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => { localStorage.setItem('myos-dark-mode', JSON.stringify(isDarkMode)) }, [isDarkMode])

  const [page, setPage] = useState<
    'home' | 'today' | 'launcher' | 'timer' | 'calendar' | 'todos' | 'schedule' | 'memo' | 'expense' | 'diary' | 'backup' | 'settings'
  >('home')

  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('myos-todos')
    if (!saved) return []
    try { return JSON.parse(saved).map((todo: Todo) => ({ ...todo, date: todo.date ?? getTodayKST(), priority: todo.priority ?? 'normal', time: todo.time ?? '' })) } catch { return [] }
  })
  const [newTodo, setNewTodo] = useState(''); const [newTodoDate, setNewTodoDate] = useState(getTodayKST()); const [newTodoTime, setNewTodoTime] = useState(''); const [newTodoPriority, setNewTodoPriority] = useState<TodoPriority>('normal'); const [editingTodoId, setEditingTodoId] = useState<number | null>(null); const [todoSearch, setTodoSearch] = useState('')

  const [schedules, setSchedules] = useState<Schedule[]>(() => { const saved = localStorage.getItem('myos-schedules'); return saved ? JSON.parse(saved) : [] })
  const [newScheduleTitle, setNewScheduleTitle] = useState(''); const [newScheduleDate, setNewScheduleDate] = useState(getTodayKST()); const [newScheduleTime, setNewScheduleTime] = useState(''); const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)

  const [memos, setMemos] = useState<Memo[]>(() => { const saved = localStorage.getItem('myos-memos'); return saved ? JSON.parse(saved) : [] })
  const [newMemoTitle, setNewMemoTitle] = useState(''); const [newMemoContent, setNewMemoContent] = useState(''); const [editingMemoId, setEditingMemoId] = useState<number | null>(null); const [memoSearch, setMemoSearch] = useState('')

  const [expenses, setExpenses] = useState<Expense[]>(() => { const saved = localStorage.getItem('myos-expenses'); return saved ? JSON.parse(saved) : [] })
  const [newExpenseAmount, setNewExpenseAmount] = useState(''); const [newExpenseDescription, setNewExpenseDescription] = useState(''); const [newExpenseType, setNewExpenseType] = useState<ExpenseType>('expense'); const [newExpenseDate, setNewExpenseDate] = useState(getTodayKST()); const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null); const [expenseSearch, setExpenseSearch] = useState('')
  const [expenseMonth, setExpenseMonth] = useState(getTodayKST().slice(0, 7))

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => { const saved = localStorage.getItem('myos-subscriptions'); return saved ? JSON.parse(saved) : [] })
  const [newSubName, setNewSubName] = useState(''); const [newSubAmount, setNewSubAmount] = useState(''); const [newSubDay, setNewSubDay] = useState('')

  const [diaries, setDiaries] = useState<Diary[]>(() => { const saved = localStorage.getItem('myos-diaries'); return saved ? JSON.parse(saved) : [] })
  const [newDiaryDate, setNewDiaryDate] = useState(getTodayKST()); const [newDiaryContent, setNewDiaryContent] = useState(''); const [newDiaryPhoto, setNewDiaryPhoto] = useState<string | null>(null); const [editingDiaryId, setEditingDiaryId] = useState<number | null>(null)

  const [launchers, setLaunchers] = useState<Launcher[]>(() => { const saved = localStorage.getItem('myos-launchers'); return saved ? JSON.parse(saved) : [] })
  const [newLauncherName, setNewLauncherName] = useState(''); const [newLauncherUrl, setNewLauncherUrl] = useState('')

  const [studyMinutes, setStudyMinutes] = useState(50)
  const [breakMinutes, setBreakMinutes] = useState(10)
  const [timeLeft, setTimeLeft] = useState(50 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study')

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0) {
      setIsTimerRunning(false)
      triggerHaptic();
      if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', { body: timerMode === 'study' ? '집중 시간이 종료되었습니다! 휴식하세요.' : '휴식 시간이 종료되었습니다! 다시 집중해볼까요?' })
      }
      alert(timerMode === 'study' ? '집중 시간 종료! 휴식하세요 ☕' : '휴식 시간 종료! 다시 집중해봅시다 🔥')
      const nextMode = timerMode === 'study' ? 'break' : 'study'
      setTimerMode(nextMode)
      setTimeLeft(nextMode === 'study' ? studyMinutes * 60 : breakMinutes * 60)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft, timerMode, studyMinutes, breakMinutes])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  useEffect(() => { localStorage.setItem('myos-todos', JSON.stringify(todos)) }, [todos])
  useEffect(() => { localStorage.setItem('myos-schedules', JSON.stringify(schedules)) }, [schedules])
  useEffect(() => { localStorage.setItem('myos-memos', JSON.stringify(memos)) }, [memos])
  useEffect(() => { localStorage.setItem('myos-expenses', JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem('myos-diaries', JSON.stringify(diaries)) }, [diaries])
  useEffect(() => { localStorage.setItem('myos-subscriptions', JSON.stringify(subscriptions)) }, [subscriptions])
  useEffect(() => { localStorage.setItem('myos-launchers', JSON.stringify(launchers)) }, [launchers])

  const requestNotification = () => {
    if (!('Notification' in window)) { alert('이 브라우저는 알림을 지원하지 않습니다.'); return }
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') { new Notification('MYos 시스템', { body: '알림 권한이 설정되었습니다.' }) } 
      else { alert('알림 권한이 거부되었습니다.') }
    })
  }

  const exportData = () => {
    triggerHaptic();
    const data = { todos: localStorage.getItem('myos-todos'), schedules: localStorage.getItem('myos-schedules'), memos: localStorage.getItem('myos-memos'), expenses: localStorage.getItem('myos-expenses'), diaries: localStorage.getItem('myos-diaries'), subscriptions: localStorage.getItem('myos-subscriptions'), launchers: localStorage.getItem('myos-launchers') }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `myos-backup-${getTodayKST()}.json`; a.click(); URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        if (parsed.todos) localStorage.setItem('myos-todos', parsed.todos); if (parsed.schedules) localStorage.setItem('myos-schedules', parsed.schedules); if (parsed.memos) localStorage.setItem('myos-memos', parsed.memos); if (parsed.expenses) localStorage.setItem('myos-expenses', parsed.expenses); if (parsed.diaries) localStorage.setItem('myos-diaries', parsed.diaries); if (parsed.subscriptions) localStorage.setItem('myos-subscriptions', parsed.subscriptions); if (parsed.launchers) localStorage.setItem('myos-launchers', parsed.launchers)
        alert('데이터 복원 완료. 시스템을 재시작합니다.'); window.location.reload()
      } catch { alert('올바르지 않은 백업 파일입니다.') }
    }
    reader.readAsText(file)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("2MB 이하의 이미지를 권장합니다."); return }
    const reader = new FileReader(); reader.onloadend = () => { setNewDiaryPhoto(reader.result as string) }; reader.readAsDataURL(file)
  }
  const removePhoto = () => { setNewDiaryPhoto(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  const addDiary = () => { triggerHaptic(); const content = newDiaryContent.trim(); if (!content && !newDiaryPhoto) return; const diary: Diary = { id: Date.now(), date: newDiaryDate, content, photo: newDiaryPhoto }; setDiaries((current) => [diary, ...current]); setNewDiaryContent(''); removePhoto(); setNewDiaryDate(getTodayKST()) }
  const startEditDiary = (diary: Diary) => { triggerHaptic(); setEditingDiaryId(diary.id); setNewDiaryDate(diary.date); setNewDiaryContent(diary.content); setNewDiaryPhoto(diary.photo) }
  const updateDiary = () => { triggerHaptic(); const content = newDiaryContent.trim(); if (editingDiaryId === null || (!content && !newDiaryPhoto)) return; setDiaries((current) => current.map((diary) => diary.id === editingDiaryId ? { ...diary, date: newDiaryDate, content, photo: newDiaryPhoto } : diary)); setEditingDiaryId(null); setNewDiaryContent(''); removePhoto(); setNewDiaryDate(getTodayKST()) }
  const cancelEditDiary = () => { setEditingDiaryId(null); setNewDiaryContent(''); removePhoto(); setNewDiaryDate(getTodayKST()) }
  const deleteDiary = (id: number) => { triggerHaptic(); setDiaries((current) => current.filter((diary) => diary.id !== id)) }

  const nextMonth = () => { triggerHaptic(); if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) } else { setCalMonth(calMonth + 1) } }
  const prevMonth = () => { triggerHaptic(); if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) } else { setCalMonth(calMonth - 1) } }
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()
  const generateCalendarDays = (): (number | null)[] => { const totalDays = getDaysInMonth(calYear, calMonth); const firstDay = getFirstDayOfMonth(calYear, calMonth); const days: (number | null)[] = []; for (let i = 0; i < firstDay; i++) days.push(null); for (let i = 1; i <= totalDays; i++) days.push(i); return days }
  const formatDate = (year: number, month: number, day: number) => { const m = String(month + 1).padStart(2, '0'); const d = String(day).padStart(2, '0'); return `${year}-${m}-${d}` }

  const addTodo = () => { triggerHaptic(); const text = newTodo.trim(); if (!text || !newTodoDate) return; const todo: Todo = { id: Date.now(), text, date: newTodoDate, time: newTodoTime, priority: newTodoPriority, completed: false }; setTodos((current) => [...current, todo]); setNewTodo(''); setNewTodoDate(getTodayKST()); setNewTodoTime(''); setNewTodoPriority('normal') }
  const startEditTodo = (todo: Todo) => { triggerHaptic(); setEditingTodoId(todo.id); setNewTodo(todo.text); setNewTodoDate(todo.date); setNewTodoTime(todo.time ?? ''); setNewTodoPriority(todo.priority ?? 'normal') }
  const updateTodo = () => { triggerHaptic(); const text = newTodo.trim(); if (editingTodoId === null || !text || !newTodoDate) return; setTodos((current) => current.map((todo) => todo.id === editingTodoId ? { ...todo, text, date: newTodoDate, time: newTodoTime, priority: newTodoPriority } : todo )); setEditingTodoId(null); setNewTodo(''); setNewTodoDate(getTodayKST()); setNewTodoTime(''); setNewTodoPriority('normal') }
  const cancelEditTodo = () => { setEditingTodoId(null); setNewTodo(''); setNewTodoDate(getTodayKST()); setNewTodoTime(''); setNewTodoPriority('normal') }
  const toggleTodo = (id: number) => { triggerHaptic(); setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo )) }
  const deleteTodo = (id: number) => { triggerHaptic(); setTodos((current) => current.filter((todo) => todo.id !== id)) }

  const addSchedule = () => { triggerHaptic(); const title = newScheduleTitle.trim(); if (!title || !newScheduleDate || !newScheduleTime) return; const schedule: Schedule = { id: Date.now(), title, date: newScheduleDate, time: newScheduleTime }; setSchedules((current) => [...current, schedule]); setNewScheduleTitle(''); setNewScheduleDate(getTodayKST()); setNewScheduleTime('') }
  const deleteSchedule = (id: number) => { triggerHaptic(); setSchedules((current) => current.filter((schedule) => schedule.id !== id)) }
  const startEditSchedule = (schedule: Schedule) => { triggerHaptic(); setEditingScheduleId(schedule.id); setNewScheduleTitle(schedule.title); setNewScheduleDate(schedule.date); setNewScheduleTime(schedule.time) }
  const updateSchedule = () => { triggerHaptic(); const title = newScheduleTitle.trim(); if (editingScheduleId === null || !title || !newScheduleDate || !newScheduleTime) return; setSchedules((current) => current.map((schedule) => schedule.id === editingScheduleId ? { ...schedule, title, date: newScheduleDate, time: newScheduleTime } : schedule )); setEditingScheduleId(null); setNewScheduleTitle(''); setNewScheduleDate(getTodayKST()); setNewScheduleTime('') }

  const addMemo = () => { triggerHaptic(); const title = newMemoTitle.trim(); const content = newMemoContent.trim(); if (!title || !content) return; const memo: Memo = { id: Date.now(), title, content, date: getTodayKST() }; setMemos((current) => [memo, ...current]); setNewMemoTitle(''); setNewMemoContent('') }
  const startEditMemo = (memo: Memo) => { triggerHaptic(); setEditingMemoId(memo.id); setNewMemoTitle(memo.title); setNewMemoContent(memo.content) }
  const cancelEditMemo = () => { setEditingMemoId(null); setNewMemoTitle(''); setNewMemoContent('') }
  const updateMemo = () => { triggerHaptic(); const title = newMemoTitle.trim(); const content = newMemoContent.trim(); if (editingMemoId === null || !title || !content) return; setMemos((current) => current.map((memo) => memo.id === editingMemoId ? { ...memo, title, content } : memo )); setEditingMemoId(null); setNewMemoTitle(''); setNewMemoContent('') }
  const deleteMemo = (id: number) => { triggerHaptic(); setMemos((current) => current.filter((memo) => memo.id !== id)) }

  const addExpense = () => { triggerHaptic(); const amount = Number(newExpenseAmount.replace(/[^0-9]/g, '')); const description = newExpenseDescription.trim(); if (!amount || amount <= 0 || !description || !newExpenseDate) return; const expense: Expense = { id: Date.now(), amount, description, type: newExpenseType, date: newExpenseDate }; setExpenses((current) => [expense, ...current]); setNewExpenseAmount(''); setNewExpenseDescription(''); setNewExpenseDate(getTodayKST()) }
  const startEditExpense = (expense: Expense) => { triggerHaptic(); setEditingExpenseId(expense.id); setNewExpenseAmount(expense.amount.toString()); setNewExpenseDescription(expense.description); setNewExpenseType(expense.type); setNewExpenseDate(expense.date) }
  const cancelEditExpense = () => { setEditingExpenseId(null); setNewExpenseAmount(''); setNewExpenseDescription(''); setNewExpenseType('expense'); setNewExpenseDate(getTodayKST()) }
  const updateExpense = () => { triggerHaptic(); const amount = Number(newExpenseAmount.replace(/[^0-9]/g, '')); const description = newExpenseDescription.trim(); if (editingExpenseId === null || !amount || amount <= 0 || !description || !newExpenseDate) return; setExpenses((current) => current.map((expense) => expense.id === editingExpenseId ? { ...expense, amount, description, type: newExpenseType, date: newExpenseDate } : expense )); setEditingExpenseId(null); setNewExpenseAmount(''); setNewExpenseDescription(''); setNewExpenseType('expense'); setNewExpenseDate(getTodayKST()) }
  const deleteExpense = (id: number) => { triggerHaptic(); setExpenses((current) => current.filter((expense) => expense.id !== id)) }

  const addSubscription = () => { triggerHaptic(); const amount = Number(newSubAmount.replace(/[^0-9]/g, '')); const day = Number(newSubDay); if (!newSubName.trim() || !amount || amount <= 0 || !day || day < 1 || day > 31) return; const sub: Subscription = { id: Date.now(), name: newSubName.trim(), amount, billingDay: day }; setSubscriptions(curr => [...curr, sub]); setNewSubName(''); setNewSubAmount(''); setNewSubDay('') }
  const deleteSubscription = (id: number) => { triggerHaptic(); setSubscriptions(curr => curr.filter(s => s.id !== id)) }

  const addLauncher = () => { triggerHaptic(); let url = newLauncherUrl.trim(); if (!newLauncherName.trim() || !url) return; if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url; const launcher: Launcher = { id: Date.now(), name: newLauncherName.trim(), url }; setLaunchers(curr => [...curr, launcher]); setNewLauncherName(''); setNewLauncherUrl('') }
  const deleteLauncher = (id: number, e: React.MouseEvent) => { triggerHaptic(); e.stopPropagation(); setLaunchers(curr => curr.filter(l => l.id !== id)) }

  const shiftExpenseMonth = (direction: 'prev' | 'next') => { triggerHaptic(); const [year, month] = expenseMonth.split('-').map(Number); const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1); const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); setExpenseMonth(`${y}-${m}`) }

  const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(expenseMonth))
  const totalIncome = currentMonthExpenses.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = currentMonthExpenses.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
  const totalSubAmount = subscriptions.reduce((sum, s) => sum + s.amount, 0)
  const balance = totalIncome - totalExpense - totalSubAmount

  const getNearestSchedule = () => {
    const todayStr = getTodayKST()
    const futureSchedules = schedules.filter((s) => s.date >= todayStr).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    if (futureSchedules.length === 0) return null
    const nearest = futureSchedules[0]
    const todayDate = new Date(todayStr); const targetDate = new Date(nearest.date)
    const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    return { ...nearest, dDayStr: diffDays === 0 ? 'D-Day' : `D-${diffDays}` }
  }

  const sendBriefing = () => {
    triggerHaptic();
    const todayStr = getTodayKST()
    const todayTodos = todos.filter(t => t.date === todayStr && !t.completed).length
    const nextSch = getNearestSchedule()
    const balanceStr = balance >= 0 ? `잔여 예산 ${balance.toLocaleString()}원` : `예산 초과 ${Math.abs(balance).toLocaleString()}원`
    let briefingText = `오늘 남은 할 일은 ${todayTodos}개입니다.\n현재 ${balanceStr}입니다.`
    if (nextSch) briefingText += `\n다가오는 일정: ${nextSch.title} (${nextSch.dDayStr})`

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      alert("스마트 브리핑 알림을 받으려면 알림 권한을 허용해 주세요.")
      requestNotification()
      return
    }
    new Notification('MYos 오늘의 브리핑', { body: briefingText })
  }

  const navigateTo = (targetPage: typeof page) => { triggerHaptic(); setPage(targetPage); setShowMenu(false); setShowAdd(false) }

  const handlePinClick = (num: string) => {
    triggerHaptic();
    if (inputPin.length < 4) {
      const newPin = inputPin + num
      setInputPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === savedPin) { setIsLocked(false); setInputPin('') } 
          else { triggerHaptic(); alert('비밀번호가 일치하지 않습니다.'); setInputPin('') }
        }, 100)
      }
    }
  }

  if (isLocked) {
    return (
      <div className={`app lock-screen-bg ${isDarkMode ? 'dark' : ''}`}>
        <div className="lock-container">
          <h2>시스템 잠금</h2>
          <p>비밀번호를 입력하세요.</p>
          <div className="pin-dots">
            {[0, 1, 2, 3].map(i => <div key={i} className={`dot ${inputPin.length > i ? 'filled' : ''}`} />)}
          </div>
          <div className="numpad">
            {['1','2','3','4','5','6','7','8','9','','0','←'].map((num, idx) => (
              <button key={idx} className={`num-btn ${num === '' ? 'empty' : ''}`} onClick={() => {
                if (num === '←') { triggerHaptic(); setInputPin(prev => prev.slice(0, -1)); }
                else if (num !== '') handlePinClick(num)
              }}>{num}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${isDarkMode ? 'dark' : ''}`}>
      {isLoading && (
        <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
          <div className="splash-content">
            <div className="splash-logo">MYos</div>
            <div className="splash-desc">Personal Operating System</div>
          </div>
        </div>
      )}

      {selectedCalDate && (
        <div className="modal-overlay" onClick={() => { triggerHaptic(); setSelectedCalDate(null); }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { triggerHaptic(); setSelectedCalDate(null); }}>✕</button>
            <h2 style={{marginTop:0, marginBottom:'24px', fontSize:'1.4rem', fontWeight:'800', letterSpacing:'-0.5px'}}>
              {selectedCalDate} 상세 내역
            </h2>
            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              {(() => {
                const day = parseInt(selectedCalDate.split('-')[2])
                const daySchedules = schedules.filter(s => s.date === selectedCalDate)
                const dayTodos = todos.filter(t => t.date === selectedCalDate)
                const dayExpenses = expenses.filter(e => e.date === selectedCalDate)
                const dayDiaries = diaries.filter(d => d.date === selectedCalDate)
                const daySubs = subscriptions.filter(s => s.billingDay === day)
                
                if (daySchedules.length === 0 && dayTodos.length === 0 && dayExpenses.length === 0 && dayDiaries.length === 0 && daySubs.length === 0) {
                  return <div className="empty-state" style={{padding:'20px'}}>기록된 내역이 없습니다.</div>
                }

                return (
                  <>
                    {daySchedules.length > 0 && <div><h3 style={{fontSize:'1rem', color:'var(--primary-color)', marginBottom:'8px'}}>📅 일정</h3>{daySchedules.map(s => <div key={s.id} style={{padding:'8px 12px', background:'rgba(150,150,150,0.1)', borderRadius:'12px', marginBottom:'4px'}}><strong>{s.time}</strong> {s.title}</div>)}</div>}
                    {dayTodos.length > 0 && <div><h3 style={{fontSize:'1rem', color:'#ff3b30', marginBottom:'8px'}}>☑️ 할 일</h3>{dayTodos.map(t => <div key={t.id} style={{padding:'8px 12px', background:'rgba(150,150,150,0.1)', borderRadius:'12px', marginBottom:'4px', textDecoration: t.completed?'line-through':'none', color: t.completed?'var(--text-secondary)':'inherit'}}>{t.text}</div>)}</div>}
                    {dayExpenses.length > 0 && <div><h3 style={{fontSize:'1rem', color:'#34c759', marginBottom:'8px'}}>💰 수입/지출</h3>{dayExpenses.map(e => <div key={e.id} style={{padding:'8px 12px', background:'rgba(150,150,150,0.1)', borderRadius:'12px', marginBottom:'4px', display:'flex', justifyContent:'space-between'}}><span>{e.description}</span><strong style={{color: e.type==='income'?'#34c759':'#ff3b30'}}>{e.type==='income'?'+':'-'}{e.amount.toLocaleString()}원</strong></div>)}</div>}
                    {daySubs.length > 0 && <div><h3 style={{fontSize:'1rem', color:'var(--text-secondary)', marginBottom:'8px'}}>💳 고정 결제</h3>{daySubs.map(s => <div key={s.id} style={{padding:'8px 12px', background:'rgba(150,150,150,0.1)', borderRadius:'12px', marginBottom:'4px', display:'flex', justifyContent:'space-between'}}><span>{s.name}</span><strong>-{s.amount.toLocaleString()}원</strong></div>)}</div>}
                    {dayDiaries.length > 0 && <div><h3 style={{fontSize:'1rem', color:'#ff9500', marginBottom:'8px'}}>📝 일기</h3>{dayDiaries.map(d => <div key={d.id} style={{padding:'8px 12px', background:'rgba(150,150,150,0.1)', borderRadius:'12px', marginBottom:'4px', whiteSpace:'pre-wrap'}}>{d.content}</div>)}</div>}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="modal-overlay" onClick={() => { triggerHaptic(); setShowHelp(false); }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { triggerHaptic(); setShowHelp(false); }}>✕</button>
            <h2 style={{marginTop:0, marginBottom:'24px', fontSize:'1.4rem', fontWeight:'800', display:'flex', alignItems:'center', gap:'8px'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              MYos 도움말
            </h2>
            <div style={{display:'flex', flexDirection:'column', gap:'20px', color:'var(--text-primary)'}}>
              <div style={{background:'rgba(150,150,150,0.1)', padding:'16px', borderRadius:'16px'}}>
                <h3 style={{margin:'0 0 8px 0', fontSize:'1.05rem', display:'flex', alignItems:'center', gap:'6px'}}>☑️ 할 일 vs 오늘 vs 일정</h3>
                <p style={{margin:0, fontSize:'0.9rem', lineHeight:'1.5', color:'var(--text-secondary)'}}>
                  <strong>할 일:</strong> 언젠가 완료하고 체크(✓)해야 하는 모든 작업의 리스트업 창고입니다.<br/>
                  <strong>일정:</strong> 특정 시간, 장소가 정해진 이벤트(시험, 미팅 등)를 캘린더에 표시합니다.<br/>
                  <strong>오늘:</strong> 할 일 목록 중 '딱 오늘 하루 집중해서 끝낼 작업'만 모아보는 대시보드입니다.
                </p>
              </div>
              <div><strong style={{display:'block', marginBottom:'4px'}}>🚀 퀵 런처</strong><span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>자주 가는 웹사이트(학교 포털, 프로그래머스 등) 링크를 등록하여 원클릭으로 접속하세요.</span></div>
              <div><strong style={{display:'block', marginBottom:'4px'}}>⏱️ Pomodoro Timer</strong><span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>집중 시간과 휴식 시간을 설정하고 루틴을 관리합니다. 공부나 코딩할 때 유용합니다.</span></div>
              <div><strong style={{display:'block', marginBottom:'4px'}}>💰 지출</strong><span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>수입/지출을 기록하고 월별로 확인합니다. 우측에 매월 나가는 구독료(고정 지출)도 등록할 수 있습니다.</span></div>
              <div><strong style={{display:'block', marginBottom:'4px'}}>💾 데이터 관리</strong><span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>현재 저장된 모든 데이터를 `.json` 파일로 기기에 백업하고, 다른 기기에서 복구할 수 있습니다.</span></div>
              <div><strong style={{display:'block', marginBottom:'4px'}}>🔒 설정 (잠금)</strong><span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>4자리 PIN 번호를 설정하면, 앱을 열 때마다 비밀번호를 요구하여 사생활을 보호합니다.</span></div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 사이드 메뉴에 도움말 버튼 추가 완료 */}
      <aside className={`side-menu ${showMenu ? 'open' : ''}`}>
        <div className="menu-header"><span>Myos</span><button onClick={() => setShowMenu(false)}>✕</button></div>
        <nav>
          <button onClick={() => navigateTo('home')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <span>홈</span></button>
          <button onClick={() => navigateTo('today')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> <span>오늘</span></button>
          <button onClick={() => navigateTo('launcher')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> <span>퀵 런처</span></button>
          <button onClick={() => navigateTo('timer')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <span>Pomodoro Timer</span></button>
          <button onClick={() => navigateTo('calendar')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> <span>캘린더</span></button>
          <button onClick={() => navigateTo('todos')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> <span>할 일</span></button>
          <button onClick={() => navigateTo('schedule')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> <span>일정</span></button>
          <button onClick={() => navigateTo('memo')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> <span>메모</span></button>
          <button onClick={() => navigateTo('diary')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> <span>일기</span></button>
          <button onClick={() => navigateTo('expense')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> <span>지출</span></button>
          
          <button onClick={() => { triggerHaptic(); setShowMenu(false); setShowHelp(true); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>도움말</span>
          </button>
          <button onClick={() => navigateTo('backup')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> <span>데이터 관리</span></button>
        </nav>
        <div style={{ marginTop: '12px', padding: '0 4px' }}><button onClick={requestNotification} className="secondary-btn" style={{ width: '100%', fontSize: '13px' }}>알림 권한 설정</button></div>
        <div className="dark-mode-toggle-container">
          <span className="dark-mode-label">다크 모드</span>
          <label className="switch"><input type="checkbox" checked={isDarkMode} onChange={() => { triggerHaptic(); setIsDarkMode(!isDarkMode); }} /><span className="slider"></span></label>
        </div>
        <button className="settings" onClick={() => navigateTo('settings')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> <span>설정 (잠금)</span></button>
      </aside>

      {showMenu && <div className="overlay" onClick={() => setShowMenu(false)} />}

      <main className="home">
        {/* 상단 헤더 원래대로 롤백 (깔끔하게) */}
        <header>
          <button className="menu-button" onClick={() => { triggerHaptic(); setShowMenu(true); }}>☰</button>
          <div className="logo" onClick={() => navigateTo('home')} style={{ cursor: 'pointer' }}>Myos</div>
          <button className="profile-button" onClick={triggerHaptic}>○</button>
        </header>

        {page === 'home' && (
          <>
            <section className="welcome">
              <h1>오늘을 관리하세요.</h1>
              <p>필요한 것을 간단하게 시작해보세요.</p>
            </section>
            
            <div className="briefing-widget" onClick={sendBriefing}>
              <div className="briefing-header"><span className="briefing-title">오늘의 브리핑</span><button className="briefing-btn">알림 받기</button></div>
              <div className="briefing-content">
                <div>남은 할 일: <strong>{todos.filter(t => t.date === getTodayKST() && !t.completed).length}개</strong></div>
                <div>이달 잔액: <strong>{balance.toLocaleString()}원</strong></div>
              </div>
            </div>

            {(() => {
              const nearest = getNearestSchedule(); if (!nearest) return null
              return (
                <div className="home-widget" onClick={() => navigateTo('schedule')}>
                  <div>
                    <small style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>주요 일정</small>
                    <div style={{ fontSize: '1.05rem', fontWeight: 'bold', marginTop: '4px' }}>{nearest.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{nearest.date} {nearest.time}</div>
                  </div>
                  <div className="widget-badge">{nearest.dDayStr}</div>
                </div>
              )
            })()}
            <button className="add-button" onClick={() => { triggerHaptic(); setShowAdd(!showAdd); }}>+</button>
            {showAdd && (
              <div className="add-menu">
                <button onClick={() => navigateTo('todos')}>할 일</button><button onClick={() => navigateTo('schedule')}>일정</button><button onClick={() => navigateTo('diary')}>일기 작성</button><button onClick={() => navigateTo('expense')}>지출 등록</button>
              </div>
            )}
          </>
        )}

        {page === 'timer' && (
          <section className="timer-page">
            <div className="page-title"><span>Myos</span><h1>Pomodoro Timer</h1><p>자유로운 집중 & 휴식 루틴 관리.</p></div>
            <div className="timer-container">
              <div className="timer-mode-selector">
                <button className={timerMode === 'study' ? 'active' : ''} onClick={() => { triggerHaptic(); setTimerMode('study'); setTimeLeft(studyMinutes * 60); setIsTimerRunning(false) }}>집중 모드</button>
                <button className={timerMode === 'break' ? 'active' : ''} onClick={() => { triggerHaptic(); setTimerMode('break'); setTimeLeft(breakMinutes * 60); setIsTimerRunning(false) }}>휴식 모드</button>
              </div>
              
              <div className="timer-display">{formatTime(timeLeft)}</div>

              {!isTimerRunning && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {timerMode === 'study' ? '집중' : '휴식'} 시간(분):
                  </span>
                  <input 
                    type="number" 
                    min="1" max="180"
                    value={timerMode === 'study' ? studyMinutes : breakMinutes}
                    onChange={(e) => {
                      triggerHaptic();
                      const val = parseInt(e.target.value) || 1;
                      if (timerMode === 'study') { setStudyMinutes(val); setTimeLeft(val * 60); }
                      else { setBreakMinutes(val); setTimeLeft(val * 60); }
                    }}
                    style={{ width: '80px', textAlign: 'center', padding: '8px', minHeight: '40px', fontSize: '1rem' }}
                  />
                </div>
              )}
              {isTimerRunning && <div style={{ height: '74px' }}></div>}

              <div className="timer-controls">
                <button className="primary-btn" onClick={() => { triggerHaptic(); setIsTimerRunning(!isTimerRunning) }}>{isTimerRunning ? '일시정지' : '시작'}</button>
                <button className="secondary-btn" onClick={() => { triggerHaptic(); setIsTimerRunning(false); setTimeLeft(timerMode === 'study' ? studyMinutes * 60 : breakMinutes * 60) }}>초기화</button>
              </div>
            </div>
          </section>
        )}

        {page === 'settings' && (
          <section className="settings-page">
            <div className="page-title"><span>Myos</span><h1>설정</h1><p>보안 및 시스템 설정.</p></div>
            <div className="settings-panel">
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>🔒 앱 잠금 설정 (PIN)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>4자리 비밀번호를 설정하여 앱을 안전하게 보호하세요.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="password" placeholder="4자리 숫자 입력" maxLength={4} value={setupPin} onChange={e => setSetupPin(e.target.value.replace(/[^0-9]/g, ''))} style={{ flex: 1, padding: '12px' }} />
                <button className="primary-btn" onClick={() => {
                  triggerHaptic();
                  if (setupPin.length === 4) {
                    localStorage.setItem('myos-pin', setupPin); setSavedPin(setupPin); alert('비밀번호가 설정되었습니다.'); setSetupPin('')
                  } else { alert('4자리 숫자를 입력해주세요.') }
                }}>등록</button>
              </div>
              {savedPin && (
                <button className="secondary-btn" style={{ width: '100%', marginTop: '12px', color: '#ff3b30' }} onClick={() => {
                  triggerHaptic(); localStorage.removeItem('myos-pin'); setSavedPin(''); setIsLocked(false); alert('비밀번호가 해제되었습니다.')
                }}>비밀번호 잠금 해제 (삭제)</button>
              )}
            </div>
          </section>
        )}

        {page === 'launcher' && (
          <section className="launcher-page">
            <div className="page-title"><span>Myos</span><h1>퀵 런처</h1><p>자주 접속하는 링크를 등록하세요.</p></div>
            <div className="launcher-input-area" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <input type="text" placeholder="사이트 이름 (예: 학교 포털)" value={newLauncherName} onChange={e => setNewLauncherName(e.target.value)} />
              <input type="text" placeholder="URL 주소 (예: github.com)" value={newLauncherUrl} onChange={e => setNewLauncherUrl(e.target.value)} />
              <button className="primary-btn" onClick={addLauncher}>바로가기 추가</button>
            </div>
            <div className="launcher-grid">
              {launchers.length === 0 && <div className="empty-state">등록된 바로가기가 없습니다.</div>}
              {launchers.map(launcher => (
                <div className="launcher-card" key={launcher.id} onClick={() => { triggerHaptic(); window.open(launcher.url, '_blank'); }}>
                  <div className="launcher-content"><span className="launcher-name">{launcher.name}</span><span className="launcher-url">{launcher.url.replace(/^https?:\/\//, '')}</span></div>
                  <button className="launcher-delete" onClick={(e) => deleteLauncher(launcher.id, e)}>✕</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'calendar' && (
          <section className="calendar-page">
            <div className="page-title"><span>Myos</span><h1>캘린더</h1></div>
            <div className="calendar-summary-panel">
              <div className="cal-sum-item"><small>수입</small><div style={{ color: '#34c759' }}>+{expenses.filter(e => e.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,'0')}`) && e.type === 'income').reduce((s, e) => s + e.amount, 0).toLocaleString()}</div></div>
              <div className="cal-sum-item"><small>지출</small><div style={{ color: '#ff3b30' }}>-{expenses.filter(e => e.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,'0')}`) && e.type === 'expense').reduce((s, e) => s + e.amount, 0).toLocaleString()}</div></div>
              <div className="cal-sum-item"><small>고정 지출</small><div style={{ color: 'var(--text-secondary)' }}>-{totalSubAmount.toLocaleString()}</div></div>
            </div>
            <div className="calendar-header">
              <button onClick={prevMonth}>◀</button><h2>{calYear}년 {calMonth + 1}월</h2><button onClick={nextMonth}>▶</button>
            </div>
            <div className="calendar-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (<div key={day} className="calendar-day-header">{day}</div>))}
              {generateCalendarDays().map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="calendar-cell empty"></div>
                const currentDate = formatDate(calYear, calMonth, day)
                const daySchedules = schedules.filter(s => s.date === currentDate)
                const dayTodos = todos.filter(t => t.date === currentDate)
                const dayDiaries = diaries.filter(d => d.date === currentDate)
                const dayExpenses = expenses.filter(e => e.date === currentDate)
                const daySubs = subscriptions.filter(s => s.billingDay === day)
                const dailyIncome = dayExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
                const dailyOut = dayExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0) + daySubs.reduce((sum, s) => sum + s.amount, 0)
                const dailyNet = dailyIncome - dailyOut
                return (
                  <div key={day} className={`calendar-cell ${currentDate === getTodayKST() ? 'today' : ''}`} onClick={() => { triggerHaptic(); setSelectedCalDate(currentDate); }} style={{ cursor: 'pointer' }}>
                    <span className="day-number">{day}</span>
                    <div className="cell-content">
                      {daySubs.map(s => <div key={s.id} className="badge sub">결제: {s.name}</div>)}
                      {daySchedules.map(s => <div key={s.id} className="badge schedule">{s.time} {s.title}</div>)}
                      {dayTodos.map(t => <div key={t.id} className="badge todo">{t.time} {t.text}</div>)}
                      {dayExpenses.length > 0 && <div className={`badge ${dailyNet >= 0 ? 'income' : 'expense'}`}>{dailyNet > 0 ? '+' : ''}{dailyNet.toLocaleString()}원</div>}
                      {dayDiaries.length > 0 && <div className="badge diary">일기</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {page === 'todos' && (
          <section className="todo-page">
            <div className="page-title"><span>Myos</span><h1>할 일</h1></div>
            <div className="todo-input" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              <input type="text" placeholder="할 일 입력" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <input type="date" value={newTodoDate} onChange={(e) => setNewTodoDate(e.target.value)} className="date-input" style={{ flex: 1.5 }} />
                <input type="time" value={newTodoTime} onChange={(e) => setNewTodoTime(e.target.value)} className="time-input" style={{ flex: 1 }} />
                <select value={newTodoPriority} onChange={(e) => setNewTodoPriority(e.target.value as TodoPriority)} style={{ flex: 1 }}>
                  <option value="high">높음</option><option value="normal">보통</option><option value="low">낮음</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button className="primary-btn" style={{ flex: 1 }} onClick={editingTodoId === null ? addTodo : updateTodo}>{editingTodoId === null ? '추가' : '저장'}</button>
              {editingTodoId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={() => { triggerHaptic(); cancelEditTodo(); }}>취소</button>}
            </div>
            <input type="text" placeholder="검색어 입력..." value={todoSearch} onChange={(e) => setTodoSearch(e.target.value)} className="search-bar" />
            <div className="todo-list">
              {todos.length === 0 && <div className="empty-state">내역이 없습니다.</div>}
              {sortTodos(todos).filter(t => t.text.includes(todoSearch)).map((todo) => (
                <div className={`todo-item ${todo.completed ? 'completed' : ''}`} key={todo.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <button className="check-button" onClick={() => toggleTodo(todo.id)}>{todo.completed ? '✓' : ''}</button>
                    <span style={{ fontSize: '1.05rem', fontWeight: '500', wordBreak: 'break-all', flex: 1 }}>{todo.text}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingLeft: '34px' }}>
                    <small style={{ color: 'var(--text-secondary)' }}>{todo.date} {todo.time && `| ${todo.time}`}</small>
                    <div className="actions"><button className="edit-button" onClick={() => startEditTodo(todo)}>수정</button><button className="delete-button" onClick={() => deleteTodo(todo.id)}>삭제</button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'schedule' && (
          <section className="schedule-page">
            <div className="page-title"><span>Myos</span><h1>일정</h1></div>
            <div className="schedule-input" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              <input type="text" placeholder="일정 제목" value={newScheduleTitle} onChange={(e) => setNewScheduleTitle(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" value={newScheduleDate} onChange={(e) => setNewScheduleDate(e.target.value)} className="date-input" style={{ flex: 1.5 }} />
                <input type="time" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)} className="time-input" style={{ flex: 1 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button className="primary-btn" style={{ flex: 1 }} onClick={editingScheduleId === null ? addSchedule : updateSchedule}>{editingScheduleId === null ? '추가' : '수정'}</button>
              {editingScheduleId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={() => { triggerHaptic(); setEditingScheduleId(null); }}>취소</button>}
            </div>
            <div className="schedule-list">
              {schedules.length === 0 && <div className="empty-state">내역이 없습니다.</div>}
              {schedules.map((schedule) => (
                <div className="schedule-item" key={schedule.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{schedule.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <small style={{ color: 'var(--text-secondary)' }}>{schedule.date} | {schedule.time}</small>
                    <div className="actions"><button className="edit-button" onClick={() => startEditSchedule(schedule)}>수정</button><button className="delete-button" onClick={() => deleteSchedule(schedule.id)}>삭제</button></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'expense' && (
          <section className="expense-page">
            <div className="page-title"><span>Myos</span><h1>지출</h1></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--glass-bg)', padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <button onClick={() => shiftExpenseMonth('prev')} style={{ border: 'none', background: 'rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>이전</button>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{expenseMonth}</strong>
              <button onClick={() => shiftExpenseMonth('next')} style={{ border: 'none', background: 'rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>다음</button>
            </div>
            <div className="expense-dashboard">
              <div className="expense-main">
                <div className="expense-input">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select value={newExpenseType} onChange={(e) => setNewExpenseType(e.target.value as ExpenseType)} style={{ flex: 1 }}><option value="expense">지출</option><option value="income">수입</option></select>
                    <input type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} className="date-input" style={{ flex: 2 }} />
                  </div>
                  <input type="text" placeholder="금액" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} style={{ marginBottom: '8px' }} />
                  <input type="text" placeholder="내용" value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} style={{ marginBottom: '16px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="primary-btn" style={{ flex: 1 }} onClick={editingExpenseId === null ? addExpense : updateExpense}>{editingExpenseId === null ? '등록' : '수정'}</button>
                    {editingExpenseId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={() => { triggerHaptic(); cancelEditExpense(); }}>취소</button>}
                  </div>
                </div>
                <input type="text" placeholder="검색..." value={expenseSearch} onChange={(e) => setExpenseSearch(e.target.value)} className="search-bar" style={{ marginTop: '20px' }} />
                <div className="expense-list">
                  {currentMonthExpenses.length === 0 && <div className="empty-state">기록이 없습니다.</div>}
                  {currentMonthExpenses.filter(e => e.description.includes(expenseSearch)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                    <div className="expense-item" key={expense.id} style={{ justifyContent: 'space-between' }}>
                      <div><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{expense.date}</div><div style={{ fontWeight: '600' }}>{expense.description}</div></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontWeight: '800', color: expense.type === 'income' ? '#34c759' : '#ff3b30' }}>{expense.type === 'income' ? '+' : '-'}{expense.amount.toLocaleString()}원</div>
                        <div className="actions"><button className="edit-button" onClick={() => startEditExpense(expense)}>수정</button><button className="delete-button" onClick={() => deleteExpense(expense.id)}>삭제</button></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="expense-sidebar">
                <div className="expense-summary-panel glass-panel">
                  <div className="summary-box"><small>{expenseMonth} 총 수입</small><div className="income-text">+{totalIncome.toLocaleString()}원</div></div>
                  <div className="summary-box"><small>{expenseMonth} 총 지출</small><div className="expense-text">-{totalExpense.toLocaleString()}원</div></div>
                  <div className="summary-box"><small>매달 고정 지출</small><div className="expense-text" style={{ color: 'var(--text-secondary)' }}>-{totalSubAmount.toLocaleString()}원</div></div>
                  <hr />
                  <div className="summary-box total"><small>{expenseMonth} 남은 잔액</small><div className={balance >= 0 ? 'income-text' : 'expense-text'}>{balance.toLocaleString()}원</div></div>
                </div>
                <div className="expense-summary-panel glass-panel" style={{ marginTop: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '700' }}>고정 지출 등록</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <input type="text" placeholder="항목 이름" value={newSubName} onChange={e => setNewSubName(e.target.value)} style={{ padding: '10px', minHeight: '44px' }} />
                    <input type="text" placeholder="금액" value={newSubAmount} onChange={e => setNewSubAmount(e.target.value)} style={{ padding: '10px', minHeight: '44px' }} />
                    <input type="number" placeholder="결제일 (1~31)" value={newSubDay} onChange={e => setNewSubDay(e.target.value)} style={{ padding: '10px', minHeight: '44px' }} />
                    <button className="secondary-btn" onClick={addSubscription} style={{ padding: '10px' }}>추가</button>
                  </div>
                  {subscriptions.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '10px 0', borderTop: '1px solid rgba(150,150,150,0.2)' }}>
                      <div>매월 {sub.billingDay}일<br/><strong>{sub.name}</strong></div>
                      <div style={{ textAlign: 'right', fontWeight: '600' }}><div>{sub.amount.toLocaleString()}원</div><button onClick={() => deleteSubscription(sub.id)} style={{ background: 'transparent', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '0.8rem', padding: 0, marginTop: '4px' }}>삭제</button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'memo' && (
          <section className="memo-page">
            <div className="page-title"><span>Myos</span><h1>메모</h1></div>
            <div className="memo-input" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              <input type="text" placeholder="제목" value={newMemoTitle} onChange={(e) => setNewMemoTitle(e.target.value)} />
              <textarea placeholder="내용" value={newMemoContent} onChange={(e) => setNewMemoContent(e.target.value)} rows={4} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="primary-btn" style={{ flex: 1 }} onClick={editingMemoId === null ? addMemo : updateMemo}>{editingMemoId === null ? '저장' : '수정'}</button>
                {editingMemoId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={() => { triggerHaptic(); cancelEditMemo(); }}>취소</button>}
              </div>
            </div>
            <input type="text" placeholder="검색..." value={memoSearch} onChange={(e) => setMemoSearch(e.target.value)} className="search-bar" />
            <div className="memo-list">
              {memos.length === 0 && <div className="empty-state">내역이 없습니다.</div>}
              {memos.filter(m => m.title.includes(memoSearch) || m.content.includes(memoSearch)).map(memo => (
                <div className="memo-item" key={memo.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{memo.title}</h3><p style={{ margin: '0 0 16px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{memo.content}</p>
                  <div className="actions"><button className="edit-button" onClick={() => startEditMemo(memo)}>수정</button><button className="delete-button" onClick={() => deleteMemo(memo.id)}>삭제</button></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'diary' && (
          <section className="diary-page">
            <div className="page-title"><span>Myos</span><h1>일기장</h1></div>
            <div className="diary-input">
              <input type="date" value={newDiaryDate} onChange={(e) => setNewDiaryDate(e.target.value)} className="date-input" />
              <textarea placeholder="기록할 내용" value={newDiaryContent} onChange={(e) => setNewDiaryContent(e.target.value)} rows={5} />
              <div className="photo-upload-section">
                <label className="photo-upload-btn">사진 첨부<input type="file" accept="image/*" onChange={(e) => { triggerHaptic(); handlePhotoUpload(e); }} ref={fileInputRef} style={{ display: 'none' }} /></label>
                {newDiaryPhoto && (<div className="photo-preview"><img src={newDiaryPhoto} alt="미리보기" /><button className="remove-photo" onClick={() => { triggerHaptic(); removePhoto(); }}>✕</button></div>)}
              </div>
              <div className="diary-actions">
                <button className="primary-btn" onClick={editingDiaryId === null ? addDiary : updateDiary}>{editingDiaryId === null ? '저장' : '수정'}</button>
                {editingDiaryId !== null && <button onClick={() => { triggerHaptic(); cancelEditDiary(); }} className="secondary-btn">취소</button>}
              </div>
            </div>
            <div className="diary-list">
              {diaries.length === 0 && <div className="empty-state">기록이 없습니다.</div>}
              {[...diaries].sort((a, b) => b.date.localeCompare(a.date)).map((diary) => (
                <div className="diary-item" key={diary.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div className="diary-header">
                    <h3>{diary.date}</h3>
                    <div className="actions"><button className="edit-button" onClick={() => startEditDiary(diary)}>수정</button><button className="delete-button" onClick={() => deleteDiary(diary.id)}>삭제</button></div>
                  </div>
                  <p className="diary-content" style={{ marginTop: '16px' }}>{diary.content}</p>
                  {diary.photo && <img src={diary.photo} alt="사진" className="diary-saved-photo" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'backup' && (
          <section className="backup-page">
            <div className="page-title"><span>Myos</span><h1>데이터 관리</h1></div>
            <div className="home-backup-panel glass-panel">
              <div><h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '700' }}>데이터 백업</h3><button onClick={exportData} className="primary-btn">파일 다운로드 (.json)</button></div>
              <hr style={{ border: '0', height: '1px', backgroundColor: 'rgba(150,150,150,0.2)', margin: '0' }} />
              <div><h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '700' }}>데이터 복구</h3><label className="secondary-btn" onClick={triggerHaptic}>파일 불러오기<input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label></div>
            </div>
          </section>
        )}

        {page === 'today' && (
          <section className="today-page">
            <div className="today-header"><span>Myos</span><h1>오늘</h1><p>{getTodayDisplayKST()}</p></div>
            <div className="today-section">
              <div className="section-header"><h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '16px' }}>작업 목록</h2></div>
              {todos.filter(t => t.date === getTodayKST()).length === 0 && <div className="empty-state">예정된 작업이 없습니다.</div>}
              {todos.filter(t => t.date === getTodayKST()).map(todo => (
                <div className="today-todo glass-panel" key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '12px' }}>
                  <button onClick={() => toggleTodo(todo.id)} style={{ width: '28px', height: '28px', border: '2px solid rgba(150,150,150,0.5)', borderRadius: '50%', background: todo.completed ? 'var(--primary-color)' : 'transparent', color: todo.completed ? '#fff' : 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', transition: 'all 0.2s' }}>{todo.completed ? '✓' : ''}</button>
                  <span style={{ fontSize: '1.05rem', fontWeight: '600', textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {todo.time && <strong style={{ marginRight: '10px' }}>{todo.time}</strong>}{todo.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App