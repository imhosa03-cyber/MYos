import { useState, useEffect } from 'react';

// 부모(App.tsx)로부터 받아올 데이터(Props)의 타입을 정의합니다.
interface PomodoroTimerProps {
  isActive: boolean;
  triggerHaptic: () => void;
}

export default function PomodoroTimer({ isActive, triggerHaptic }: PomodoroTimerProps) {
  // 기존 App.tsx에 있던 타이머 상태들
  const [studyMinutes, setStudyMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerTargetTime, setTimerTargetTime] = useState<number | null>(null);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');

  // 기존 App.tsx에 있던 타이머 백그라운드 로직
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerTargetTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((timerTargetTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsTimerRunning(false);
          setTimerTargetTime(null);
          triggerHaptic();
          if (Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', { body: timerMode === 'study' ? '집중 시간이 종료되었습니다! 휴식하세요.' : '휴식 시간이 종료되었습니다! 다시 집중해볼까요?' });
          }
          
          setTimeout(() => {
            alert(timerMode === 'study' ? '집중 시간 종료! 휴식하세요 ☕' : '휴식 시간 종료! 다시 집중해봅시다 🔥');
            const nextMode = timerMode === 'study' ? 'break' : 'study';
            setTimerMode(nextMode);
            setTimeLeft(nextMode === 'study' ? studyMinutes * 60 : breakMinutes * 60);
          }, 100);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerTargetTime, timerMode, studyMinutes, breakMinutes, triggerHaptic]);

  const toggleTimer = () => {
    triggerHaptic();
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setTimerTargetTime(null);
    } else {
      setIsTimerRunning(true);
      setTimerTargetTime(Date.now() + timeLeft * 1000);
    }
  };

  const resetTimer = () => {
    triggerHaptic();
    setIsTimerRunning(false);
    setTimerTargetTime(null);
    setTimeLeft(timerMode === 'study' ? studyMinutes * 60 : breakMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 🔥 핵심: 화면에 안 보일 때도 컴포넌트를 죽이지 않고 CSS로 숨기기만 합니다.
  return (
    <section className="timer-page" style={{ display: isActive ? 'block' : 'none' }}>
      <div className="page-title"><span>Myos</span><h1>Pomodoro Timer</h1><p>자유로운 집중 & 휴식 루틴 관리.</p></div>
      <div className="timer-container">
        <div className="timer-mode-selector">
          <button className={timerMode === 'study' ? 'active' : ''} onClick={() => { triggerHaptic(); setTimerMode('study'); setTimeLeft(studyMinutes * 60); setIsTimerRunning(false); setTimerTargetTime(null); }}>집중 모드</button>
          <button className={timerMode === 'break' ? 'active' : ''} onClick={() => { triggerHaptic(); setTimerMode('break'); setTimeLeft(breakMinutes * 60); setIsTimerRunning(false); setTimerTargetTime(null); }}>휴식 모드</button>
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
          <button className="primary-btn" onClick={toggleTimer}>{isTimerRunning ? '일시정지' : '시작'}</button>
          <button className="secondary-btn" onClick={resetTimer}>초기화</button>
        </div>
      </div>
    </section>
  );
}