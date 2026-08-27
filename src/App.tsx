import { useEffect, useState, useRef } from 'react'
import './App.css'

const getTodayKST = () => {
  const now = new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

const getTodayDisplayKST = () => {
  const now = new Date()
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(now)
}

type TodoPriority = 'high' | 'normal' | 'low'

type Todo = {
  id: number
  text: string
  date: string
  priority: TodoPriority
  completed: boolean
}

type Schedule = {
  id: number
  title: string
  date: string
  time: string
}

type Memo = {
  id: number
  title: string
  content: string
  date: string
}

type ExpenseType = 'income' | 'expense'

type Expense = {
  id: number
  amount: number
  description: string
  type: ExpenseType
  date: string
}

type Diary = {
  id: number
  date: string
  content: string
  photo: string | null
}

const priorityOrder: Record<TodoPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
}

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
  // 📌 묵직하고 긴 호흡의 스플래시 대기 시간 (2.2초 유지 후 1초 동안 아주 천천히 페이드 아웃)
  const [isLoading, setIsLoading] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2200) 
    const removeTimer = setTimeout(() => setIsLoading(false), 3200) 
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  const [showMenu, setShowMenu] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('myos-dark-mode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('myos-dark-mode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const [page, setPage] = useState<
    'home' | 'today' | 'todos' | 'schedule' | 'memo' | 'expense' | 'backup' | 'calendar' | 'diary'
  >('home')

  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('myos-todos')
    if (!saved) return []
    try {
      return JSON.parse(saved).map((todo: Todo) => ({
        ...todo, date: todo.date ?? getTodayKST(), priority: todo.priority ?? 'normal',
      }))
    } catch { return [] }
  })
  const [newTodo, setNewTodo] = useState('')
  const [newTodoDate, setNewTodoDate] = useState(getTodayKST())
  const [newTodoPriority, setNewTodoPriority] = useState<TodoPriority>('normal')
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null)
  const [todoSearch, setTodoSearch] = useState('')

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('myos-schedules')
    return saved ? JSON.parse(saved) : []
  })
  const [newScheduleTitle, setNewScheduleTitle] = useState('')
  const [newScheduleDate, setNewScheduleDate] = useState(getTodayKST())
  const [newScheduleTime, setNewScheduleTime] = useState('')
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)

  const [memos, setMemos] = useState<Memo[]>(() => {
    const saved = localStorage.getItem('myos-memos')
    return saved ? JSON.parse(saved) : []
  })
  const [newMemoTitle, setNewMemoTitle] = useState('')
  const [newMemoContent, setNewMemoContent] = useState('')
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null)
  const [memoSearch, setMemoSearch] = useState('')

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('myos-expenses')
    return saved ? JSON.parse(saved) : []
  })
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseDescription, setNewExpenseDescription] = useState('')
  const [newExpenseType, setNewExpenseType] = useState<ExpenseType>('expense')
  const [newExpenseDate, setNewExpenseDate] = useState(getTodayKST())
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null)
  const [expenseSearch, setExpenseSearch] = useState('')
  
  const [expenseMonth, setExpenseMonth] = useState(getTodayKST().slice(0, 7))

  const [diaries, setDiaries] = useState<Diary[]>(() => {
    const saved = localStorage.getItem('myos-diaries')
    return saved ? JSON.parse(saved) : []
  })
  const [newDiaryDate, setNewDiaryDate] = useState(getTodayKST())
  const [newDiaryContent, setNewDiaryContent] = useState('')
  const [newDiaryPhoto, setNewDiaryPhoto] = useState<string | null>(null)
  const [editingDiaryId, setEditingDiaryId] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  useEffect(() => { localStorage.setItem('myos-todos', JSON.stringify(todos)) }, [todos])
  useEffect(() => { localStorage.setItem('myos-schedules', JSON.stringify(schedules)) }, [schedules])
  useEffect(() => { localStorage.setItem('myos-memos', JSON.stringify(memos)) }, [memos])
  useEffect(() => { localStorage.setItem('myos-expenses', JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem('myos-diaries', JSON.stringify(diaries)) }, [diaries])

  const requestNotification = () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('MYos 알림 설정 완료!', {
          body: '중요한 일정과 할 일을 제때 알려드릴게요.',
        })
      } else {
        alert('알림 권한이 거부되었습니다.')
      }
    })
  }

  const exportData = () => {
    const data = {
      todos: localStorage.getItem('myos-todos'),
      schedules: localStorage.getItem('myos-schedules'),
      memos: localStorage.getItem('myos-memos'),
      expenses: localStorage.getItem('myos-expenses'),
      diaries: localStorage.getItem('myos-diaries'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `myos-backup-${getTodayKST()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        if (parsed.todos) localStorage.setItem('myos-todos', parsed.todos)
        if (parsed.schedules) localStorage.setItem('myos-schedules', parsed.schedules)
        if (parsed.memos) localStorage.setItem('myos-memos', parsed.memos)
        if (parsed.expenses) localStorage.setItem('myos-expenses', parsed.expenses)
        if (parsed.diaries) localStorage.setItem('myos-diaries', parsed.diaries)
        alert('데이터를 성공적으로 불러왔습니다! 앱을 새로고침합니다.')
        window.location.reload()
      } catch { alert('백업 파일 형식이 올바르지 않습니다.') }
    }
    reader.readAsText(file)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert("이미지 크기가 너무 큽니다. (2MB 이하 권장)")
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => { setNewDiaryPhoto(reader.result as string) }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setNewDiaryPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addDiary = () => {
    const content = newDiaryContent.trim()
    if (!content && !newDiaryPhoto) return
    const diary: Diary = { id: Date.now(), date: newDiaryDate, content, photo: newDiaryPhoto }
    setDiaries((current) => [diary, ...current])
    setNewDiaryContent(''); removePhoto(); setNewDiaryDate(getTodayKST())
  }

  const startEditDiary = (diary: Diary) => {
    setEditingDiaryId(diary.id); setNewDiaryDate(diary.date); setNewDiaryContent(diary.content); setNewDiaryPhoto(diary.photo)
  }

  const updateDiary = () => {
    const content = newDiaryContent.trim()
    if (editingDiaryId === null || (!content && !newDiaryPhoto)) return
    setDiaries((current) =>
      current.map((diary) => diary.id === editingDiaryId ? { ...diary, date: newDiaryDate, content, photo: newDiaryPhoto } : diary)
    )
    setEditingDiaryId(null); setNewDiaryContent(''); removePhoto(); setNewDiaryDate(getTodayKST())
  }

  const cancelEditDiary = () => {
    setEditingDiaryId(null); setNewDiaryContent(''); removePhoto(); setNewDiaryDate(getTodayKST())
  }

  const deleteDiary = (id: number) => {
    setDiaries((current) => current.filter((diary) => diary.id !== id))
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) } 
    else { setCalMonth(calMonth + 1) }
  }
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) } 
    else { setCalMonth(calMonth - 1) }
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const generateCalendarDays = () => {
    const totalDays = getDaysInMonth(calYear, calMonth)
    const firstDay = getFirstDayOfMonth(calYear, calMonth)
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(i)
    return days
  }

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const addTodo = () => {
    const text = newTodo.trim()
    if (!text || !newTodoDate) return
    const todo: Todo = { id: Date.now(), text, date: newTodoDate, priority: newTodoPriority, completed: false }
    setTodos((current) => [...current, todo]); setNewTodo(''); setNewTodoDate(getTodayKST()); setNewTodoPriority('normal')
  }
  const startEditTodo = (todo: Todo) => { setEditingTodoId(todo.id); setNewTodo(todo.text); setNewTodoDate(todo.date); setNewTodoPriority(todo.priority ?? 'normal') }
  const updateTodo = () => {
    const text = newTodo.trim()
    if (editingTodoId === null || !text || !newTodoDate) return
    setTodos((current) => current.map((todo) => todo.id === editingTodoId ? { ...todo, text, date: newTodoDate, priority: newTodoPriority } : todo ))
    setEditingTodoId(null); setNewTodo(''); setNewTodoDate(getTodayKST()); setNewTodoPriority('normal')
  }
  const cancelEditTodo = () => { setEditingTodoId(null); setNewTodo(''); setNewTodoDate(getTodayKST()); setNewTodoPriority('normal') }
  const toggleTodo = (id: number) => { setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo )) }
  const deleteTodo = (id: number) => { setTodos((current) => current.filter((todo) => todo.id !== id)) }

  const addSchedule = () => {
    const title = newScheduleTitle.trim()
    if (!title || !newScheduleDate || !newScheduleTime) return
    const schedule: Schedule = { id: Date.now(), title, date: newScheduleDate, time: newScheduleTime }
    setSchedules((current) => [...current, schedule]); setNewScheduleTitle(''); setNewScheduleDate(getTodayKST()); setNewScheduleTime('')
  }
  const deleteSchedule = (id: number) => { setSchedules((current) => current.filter((schedule) => schedule.id !== id)) }
  const startEditSchedule = (schedule: Schedule) => { setEditingScheduleId(schedule.id); setNewScheduleTitle(schedule.title); setNewScheduleDate(schedule.date); setNewScheduleTime(schedule.time) }
  const updateSchedule = () => {
    const title = newScheduleTitle.trim()
    if (editingScheduleId === null || !title || !newScheduleDate || !newScheduleTime) return
    setSchedules((current) => current.map((schedule) => schedule.id === editingScheduleId ? { ...schedule, title, date: newScheduleDate, time: newScheduleTime } : schedule ))
    setEditingScheduleId(null); setNewScheduleTitle(''); setNewScheduleDate(getTodayKST()); setNewScheduleTime('')
  }

  const addMemo = () => {
    const title = newMemoTitle.trim(); const content = newMemoContent.trim()
    if (!title || !content) return
    const memo: Memo = { id: Date.now(), title, content, date: getTodayKST() }
    setMemos((current) => [memo, ...current]); setNewMemoTitle(''); setNewMemoContent('')
  }
  const startEditMemo = (memo: Memo) => { setEditingMemoId(memo.id); setNewMemoTitle(memo.title); setNewMemoContent(memo.content) }
  const cancelEditMemo = () => { setEditingMemoId(null); setNewMemoTitle(''); setNewMemoContent('') }
  const updateMemo = () => {
    const title = newMemoTitle.trim(); const content = newMemoContent.trim()
    if (editingMemoId === null || !title || !content) return
    setMemos((current) => current.map((memo) => memo.id === editingMemoId ? { ...memo, title, content } : memo ))
    setEditingMemoId(null); setNewMemoTitle(''); setNewMemoContent('')
  }
  const deleteMemo = (id: number) => { setMemos((current) => current.filter((memo) => memo.id !== id)) }

  const addExpense = () => {
    const amount = Number(newExpenseAmount.replace(/[^0-9]/g, ''))
    const description = newExpenseDescription.trim()
    if (!amount || amount <= 0 || !description || !newExpenseDate) return
    const expense: Expense = { id: Date.now(), amount, description, type: newExpenseType, date: newExpenseDate }
    setExpenses((current) => [expense, ...current]); setNewExpenseAmount(''); setNewExpenseDescription(''); setNewExpenseDate(getTodayKST())
  }
  const startEditExpense = (expense: Expense) => { setEditingExpenseId(expense.id); setNewExpenseAmount(expense.amount.toString()); setNewExpenseDescription(expense.description); setNewExpenseType(expense.type); setNewExpenseDate(expense.date) }
  const cancelEditExpense = () => { setEditingExpenseId(null); setNewExpenseAmount(''); setNewExpenseDescription(''); setNewExpenseType('expense'); setNewExpenseDate(getTodayKST()) }
  const updateExpense = () => {
    const amount = Number(newExpenseAmount.replace(/[^0-9]/g, ''))
    const description = newExpenseDescription.trim()
    if (editingExpenseId === null || !amount || amount <= 0 || !description || !newExpenseDate) return
    setExpenses((current) => current.map((expense) => expense.id === editingExpenseId ? { ...expense, amount, description, type: newExpenseType, date: newExpenseDate } : expense ))
    setEditingExpenseId(null); setNewExpenseAmount(''); setNewExpenseDescription(''); setNewExpenseType('expense'); setNewExpenseDate(getTodayKST())
  }
  const deleteExpense = (id: number) => { setExpenses((current) => current.filter((expense) => expense.id !== id)) }

  const shiftExpenseMonth = (direction: 'prev' | 'next') => {
    const [year, month] = expenseMonth.split('-').map(Number)
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    setExpenseMonth(`${y}-${m}`)
  }

  const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(expenseMonth))
  const totalIncome = currentMonthExpenses.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = currentMonthExpenses.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
  const balance = totalIncome - totalExpense

  const getNearestSchedule = () => {
    const todayStr = getTodayKST()
    const futureSchedules = schedules.filter((s) => s.date >= todayStr).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    if (futureSchedules.length === 0) return null
    const nearest = futureSchedules[0]
    const todayDate = new Date(todayStr); const targetDate = new Date(nearest.date)
    const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    return { ...nearest, dDayStr: diffDays === 0 ? 'D-Day' : `D-${diffDays}` }
  }

  const navigateTo = (targetPage: typeof page) => {
    setPage(targetPage)
    setShowMenu(false)
    setShowAdd(false)
  }

  return (
    <div className={`app ${isDarkMode ? 'dark' : ''}`}>
      {/* 📌 아래에서 쓱 올라와서 아주 천천히 스르륵 녹아내리는 오프닝 스크린 */}
      {isLoading && (
        <div className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
          <div className="splash-content">
            <div className="splash-logo">MYos</div>
            <div className="splash-desc">나만의 개인 운영체제</div>
          </div>
        </div>
      )}

      {/* 왼쪽 메뉴 */}
      <aside className={`side-menu ${showMenu ? 'open' : ''}`}>
        <div className="menu-header">
          <span>Myos</span>
          <button onClick={() => setShowMenu(false)}>×</button>
        </div>
        <nav>
          <button onClick={() => navigateTo('home')}>홈</button>
          <button onClick={() => navigateTo('today')}>오늘</button>
          <button onClick={() => navigateTo('calendar')}>캘린더</button>
          <button onClick={() => navigateTo('todos')}>할 일</button>
          <button onClick={() => navigateTo('schedule')}>일정</button>
          <button onClick={() => navigateTo('memo')}>메모</button>
          <button onClick={() => navigateTo('diary')}>일기</button>
          <button onClick={() => navigateTo('expense')}>지출</button>
          <button onClick={() => navigateTo('backup')}>데이터 관리</button>
        </nav>

        <div style={{ marginTop: '12px', padding: '0 4px' }}>
          <button onClick={requestNotification} className="secondary-btn" style={{ width: '100%', fontSize: '13px' }}>
            🔔 푸시 알림 켜기
          </button>
        </div>

        <div className="dark-mode-toggle-container">
          <span className="dark-mode-label">다크 모드</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isDarkMode} 
              onChange={() => setIsDarkMode(!isDarkMode)} 
            />
            <span className="slider"></span>
          </label>
        </div>

        <button className="settings">설정</button>
      </aside>

      {showMenu && <div className="overlay" onClick={() => setShowMenu(false)} />}

      <main className="home">
        <header>
          <button className="menu-button" onClick={() => setShowMenu(true)}>☰</button>
          <div className="logo">Myos</div>
          <button className="profile-button">○</button>
        </header>

        {/* 홈 화면 */}
        {page === 'home' && (
          <>
            <section className="welcome">
              <h1>오늘을 관리하세요.</h1>
              <p>필요한 것을 간단하게 시작해보세요.</p>
            </section>
            {(() => {
              const nearest = getNearestSchedule()
              if (!nearest) return null
              return (
                <div className="home-widget" onClick={() => navigateTo('schedule')}>
                  <div>
                    <small style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>다가오는 주요 일정</small>
                    <div style={{ fontSize: '1.05rem', fontWeight: 'bold', marginTop: '4px' }}>{nearest.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{nearest.date} {nearest.time}</div>
                  </div>
                  <div className="widget-badge">{nearest.dDayStr}</div>
                </div>
              )
            })()}
            <button className="add-button" onClick={() => setShowAdd(!showAdd)}>+</button>
            {showAdd && (
              <div className="add-menu">
                <button onClick={() => navigateTo('todos')}>할 일</button>
                <button onClick={() => navigateTo('schedule')}>일정</button>
                <button onClick={() => navigateTo('diary')}>일기 쓰기</button>
                <button onClick={() => navigateTo('expense')}>지출</button>
              </div>
            )}
          </>
        )}

        {/* 캘린더 */}
        {page === 'calendar' && (
          <section className="calendar-page">
            <div className="page-title">
              <span>Myos</span>
              <h1>캘린더</h1>
              <p>이번 달의 모든 기록을 확인하세요.</p>
            </div>
            
            <div className="calendar-header">
              <button onClick={prevMonth}>◀</button>
              <h2>{calYear}년 {calMonth + 1}월</h2>
              <button onClick={nextMonth}>▶</button>
            </div>

            <div className="calendar-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              
              {generateCalendarDays().map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="calendar-cell empty"></div>
                
                const currentDate = formatDate(calYear, calMonth, day)
                const daySchedules = schedules.filter(s => s.date === currentDate)
                const dayTodos = todos.filter(t => t.date === currentDate)
                const dayDiaries = diaries.filter(d => d.date === currentDate)
                const dayExpenses = expenses.filter(e => e.date === currentDate)
                const dailyIncome = dayExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
                const dailyOut = dayExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
                const dailyNet = dailyIncome - dailyOut
                
                const isToday = currentDate === getTodayKST()

                return (
                  <div key={day} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                    <span className="day-number">{day}</span>
                    <div className="cell-content">
                      {daySchedules.map(s => <div key={s.id} className="badge schedule">{s.title}</div>)}
                      {dayTodos.length > 0 && <div className="badge todo">할 일 {dayTodos.length}개</div>}
                      {dayExpenses.length > 0 && (
                        <div className={`badge ${dailyNet >= 0 ? 'income' : 'expense'}`}>
                          {dailyNet > 0 ? '+' : ''}{dailyNet.toLocaleString()}원
                        </div>
                      )}
                      {dayDiaries.length > 0 && <div className="badge diary">일기</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 일기 */}
        {page === 'diary' && (
          <section className="diary-page">
            <div className="page-title">
              <span>Myos</span>
              <h1>일기장</h1>
              <p>오늘 하루의 생각과 사진을 남겨보세요.</p>
            </div>

            <div className="diary-input">
              <input type="date" value={newDiaryDate} onChange={(e) => setNewDiaryDate(e.target.value)} />
              <textarea
                placeholder="오늘 하루는 어땠나요?"
                value={newDiaryContent}
                onChange={(e) => setNewDiaryContent(e.target.value)}
                rows={5}
              />
              <div className="photo-upload-section">
                <label className="photo-upload-btn">
                  사진 첨부하기
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} ref={fileInputRef} style={{ display: 'none' }} />
                </label>
                {newDiaryPhoto && (
                  <div className="photo-preview">
                    <img src={newDiaryPhoto} alt="미리보기" />
                    <button className="remove-photo" onClick={removePhoto}>×</button>
                  </div>
                )}
              </div>

              <div className="diary-actions">
                <button className="primary-btn" onClick={editingDiaryId === null ? addDiary : updateDiary}>
                  {editingDiaryId === null ? '일기 저장' : '수정 완료'}
                </button>
                {editingDiaryId !== null && <button onClick={cancelEditDiary} className="secondary-btn">취소</button>}
              </div>
            </div>

            <div className="diary-list">
              {diaries.length === 0 && (
                <div className="empty-state">아직 작성된 일기가 없어요. 오늘 하루를 기록해보세요!</div>
              )}
              {[...diaries].sort((a, b) => b.date.localeCompare(a.date)).map((diary) => (
                <div className="diary-item" key={diary.id}>
                  <div className="diary-header">
                    <h3>{diary.date}</h3>
                    <div className="actions">
                      <button className="edit-button" onClick={() => startEditDiary(diary)}>수정</button>
                      <button className="delete-button" onClick={() => deleteDiary(diary.id)}>삭제</button>
                    </div>
                  </div>
                  <p className="diary-content">{diary.content}</p>
                  {diary.photo && <img src={diary.photo} alt="일기 사진" className="diary-saved-photo" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 백업 */}
        {page === 'backup' && (
          <section className="backup-page">
            <div className="page-title">
              <span>Myos</span>
              <h1>데이터 관리</h1>
              <p>앱의 모든 데이터를 백업하거나 복구할 수 있어요.</p>
            </div>
            <div className="home-backup-panel">
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>📦 데이터 백업</h3>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>현재 저장된 데이터를 백업합니다.</p>
                <button onClick={exportData} className="primary-btn">백업 파일 다운로드 (.json)</button>
              </div>
              <hr style={{ border: '0', height: '1px', backgroundColor: 'var(--border-color)', margin: '0' }} />
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>📥 데이터 복구</h3>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>백업 파일을 불러와 복원합니다.</p>
                <label className="secondary-btn">
                  백업 파일 불러오기
                  <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* 할 일 */}
        {page === 'todos' && (
          <section className="todo-page">
            <div className="page-title"><span>Myos</span><h1>할 일</h1></div>
            <div className="todo-input">
              <input type="text" placeholder="할 일 입력" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
              <input type="date" value={newTodoDate} onChange={(e) => setNewTodoDate(e.target.value)} />
              <select value={newTodoPriority} onChange={(e) => setNewTodoPriority(e.target.value as TodoPriority)}>
                <option value="high">높음</option>
                <option value="normal">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button className="primary-btn" style={{ flex: 1 }} onClick={editingTodoId === null ? addTodo : updateTodo}>
                {editingTodoId === null ? '추가' : '저장'}
              </button>
              {editingTodoId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={cancelEditTodo}>취소</button>}
            </div>
            <input type="text" placeholder="할 일 검색..." value={todoSearch} onChange={(e) => setTodoSearch(e.target.value)} className="search-bar" />
            <div className="todo-list">
              {todos.length === 0 && (
                <div className="empty-state">등록된 할 일이 없어요. 새로운 할 일을 추가해보세요!</div>
              )}
              {sortTodos(todos).filter(t => t.text.includes(todoSearch)).map((todo) => (
                <div className={`todo-item ${todo.completed ? 'completed' : ''}`} key={todo.id}>
                  <button className="check-button" onClick={() => toggleTodo(todo.id)}>{todo.completed ? '✓' : ''}</button>
                  <span>{todo.text}</span>
                  <div className="actions">
                    <button className="edit-button" onClick={() => startEditTodo(todo)}>수정</button>
                    <button className="delete-button" onClick={() => deleteTodo(todo.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 일정 */}
        {page === 'schedule' && (
          <section className="schedule-page">
            <div className="page-title"><span>Myos</span><h1>일정</h1></div>
            <div className="schedule-input">
              <input type="text" placeholder="일정 제목" value={newScheduleTitle} onChange={(e) => setNewScheduleTitle(e.target.value)} />
              <div className="schedule-row">
                <input type="date" value={newScheduleDate} onChange={(e) => setNewScheduleDate(e.target.value)} />
                <input type="time" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button className="primary-btn" style={{ flex: 1 }} onClick={editingScheduleId === null ? addSchedule : updateSchedule}>
                {editingScheduleId === null ? '추가' : '수정'}
              </button>
            </div>
            <div className="schedule-list">
              {schedules.length === 0 && (
                <div className="empty-state">등록된 일정이 없어요. 중요한 약속을 추가해보세요!</div>
              )}
              {schedules.map((schedule) => (
                <div className="schedule-item" key={schedule.id}>
                  <div className="schedule-time"><span>{schedule.date}</span><strong>{schedule.time}</strong></div>
                  <div className="schedule-info"><span>{schedule.title}</span></div>
                  <div className="actions">
                    <button className="edit-button" onClick={() => startEditSchedule(schedule)}>수정</button>
                    <button className="delete-button" onClick={() => deleteSchedule(schedule.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 메모 */}
        {page === 'memo' && (
          <section className="memo-page">
            <div className="page-title"><span>Myos</span><h1>메모</h1></div>
            <div className="memo-input" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
              <input type="text" placeholder="제목" value={newMemoTitle} onChange={(e) => setNewMemoTitle(e.target.value)} />
              <textarea placeholder="내용" value={newMemoContent} onChange={(e) => setNewMemoContent(e.target.value)} rows={4} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="primary-btn" style={{ flex: 1 }} onClick={editingMemoId === null ? addMemo : updateMemo}>
                  {editingMemoId === null ? '저장' : '수정'}
                </button>
                {editingMemoId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={cancelEditMemo}>취소</button>}
              </div>
            </div>
            <input type="text" placeholder="메모 검색..." value={memoSearch} onChange={(e) => setMemoSearch(e.target.value)} className="search-bar" />
            <div className="memo-list">
              {memos.length === 0 && (
                <div className="empty-state">작성된 메모가 없어요. 자유롭게 생각을 남겨보세요!</div>
              )}
              {memos.filter(m => m.title.includes(memoSearch) || m.content.includes(memoSearch)).map(memo => (
                <div className="memo-item" key={memo.id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{memo.title}</h3>
                  <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap' }}>{memo.content}</p>
                  <div className="actions">
                    <button className="edit-button" onClick={() => startEditMemo(memo)}>수정</button>
                    <button className="delete-button" onClick={() => deleteMemo(memo.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 지출 */}
        {page === 'expense' && (
          <section className="expense-page">
            <div className="page-title"><span>Myos</span><h1>지출</h1></div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'var(--glass-bg)', padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <button onClick={() => shiftExpenseMonth('prev')} style={{ border: 'none', background: 'var(--hover-bg)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>◀ 이전 달</button>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{expenseMonth}</strong>
              <button onClick={() => shiftExpenseMonth('next')} style={{ border: 'none', background: 'var(--hover-bg)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>다음 달 ▶</button>
            </div>

            <div className="expense-dashboard">
              <div className="expense-main">
                <div className="expense-input">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select value={newExpenseType} onChange={(e) => setNewExpenseType(e.target.value as ExpenseType)} style={{ flex: 1 }}>
                      <option value="expense">지출</option>
                      <option value="income">수입</option>
                    </select>
                    <input type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} style={{ flex: 2 }} />
                  </div>
                  <input type="text" placeholder="금액" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} style={{ marginBottom: '8px' }} />
                  <input type="text" placeholder="내용" value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} style={{ marginBottom: '16px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="primary-btn" style={{ flex: 1 }} onClick={editingExpenseId === null ? addExpense : updateExpense}>
                      {editingExpenseId === null ? '등록' : '수정'}
                    </button>
                    {editingExpenseId !== null && <button className="secondary-btn" style={{ flex: 1 }} onClick={cancelEditExpense}>취소</button>}
                  </div>
                </div>
                
                <input type="text" placeholder="지출 검색..." value={expenseSearch} onChange={(e) => setExpenseSearch(e.target.value)} className="search-bar" />
                
                <div className="expense-list">
                  {currentMonthExpenses.length === 0 && (
                    <div className="empty-state">해당 월에 기록된 지출/수입 내역이 없어요.</div>
                  )}
                  {currentMonthExpenses.filter(e => e.description.includes(expenseSearch)).map(expense => (
                    <div className="expense-item" key={expense.id} style={{ justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{expense.date}</div>
                        <div>{expense.description}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontWeight: 'bold', color: expense.type === 'income' ? '#34a853' : '#ea4335' }}>
                          {expense.type === 'income' ? '+' : '-'}{expense.amount.toLocaleString()}원
                        </div>
                        <div className="actions">
                          <button className="edit-button" onClick={() => startEditExpense(expense)}>수정</button>
                          <button className="delete-button" onClick={() => deleteExpense(expense.id)}>삭제</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="expense-sidebar">
                <div className="expense-summary-panel">
                  <div className="summary-box">
                    <small>{expenseMonth} 총 수입</small>
                    <div className="income-text">+{totalIncome.toLocaleString()}원</div>
                  </div>
                  <div className="summary-box">
                    <small>{expenseMonth} 총 지출</small>
                    <div className="expense-text">-{totalExpense.toLocaleString()}원</div>
                  </div>
                  <hr />
                  <div className="summary-box total">
                    <small>{expenseMonth} 잔액</small>
                    <div className={balance >= 0 ? 'income-text' : 'expense-text'}>
                      {balance.toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 오늘 */}
        {page === 'today' && (
          <section className="today-page">
            <div className="today-header"><span>Myos</span><h1>오늘</h1><p>{getTodayDisplayKST()}</p></div>
            <div className="today-section">
              <div className="section-header"><h2>오늘 해야 할 일</h2></div>
              {todos.filter(t => t.date === getTodayKST()).length === 0 && (
                <div className="empty-state">오늘 예정된 할 일이 없습니다! 휴식을 즐겨보세요 🎉</div>
              )}
              {todos.filter(t => t.date === getTodayKST()).map(todo => (
                <div className="today-todo" key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'var(--glass-bg)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--glass-border)' }}>
                  <button onClick={() => toggleTodo(todo.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>{todo.completed ? '✓' : '○'}</button>
                  <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{todo.text}</span>
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