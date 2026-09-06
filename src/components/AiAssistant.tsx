import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

interface AiAssistantProps {
  isActive: boolean;
  triggerHaptic: () => void;
  appContext?: {
    todos: any[];
    schedules: any[];
    balance: number;
    totalBalance: number;
    todayStr: string;
    diaries: any[]; // 🔥 일기 데이터를 받아오도록 추가
  };
  onAddTodo?: (data: { text: string; date?: string; time?: string }) => void;
  onAddExpense?: (data: { amount: number; description: string; type: 'income' | 'expense'; date?: string }) => void; // 🔥 지출 등록 권한 추가
  onAddSchedule?: (data: { title: string; date?: string; time?: string }) => void; // 🔥 일정 등록 권한 추가
}

type Message = { sender: 'user' | 'ai'; text: string };

export default function AiAssistant({ isActive, triggerHaptic, appContext, onAddTodo, onAddExpense, onAddSchedule }: AiAssistantProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('myos-gemini-key') || '');
  const [inputKey, setInputKey] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '안녕하세요, 호사님! 한층 더 똑똑해진 마이(Mai)입니다. 😎\n\n이제 저에게 할 일뿐만 아니라 "오늘 점심값 8천 원 지출로 등록해 줘", "다음 주 수요일 3시에 C++ 시험 일정 추가해 줘"라고 편하게 말씀해 보세요. 요즘 고민이 있다면 언제든 들어드릴게요!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const saveApiKey = () => {
    triggerHaptic();
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    localStorage.setItem('myos-gemini-key', trimmed);
    setApiKey(trimmed);
    setInputKey('');
    alert('API 키가 안전하게 저장되었습니다!');
  };

  const startListening = () => {
    triggerHaptic();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('이 브라우저는 음성 인식을 지원하지 않습니다.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => setInputMessage(event.results[0][0].transcript);
    recognition.start();
  };

  const sendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isLoading || !apiKey) return;

    triggerHaptic();
    const newMessages: Message[] = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      let contextString = '';
      if (appContext) {
        const pendingTodos = appContext.todos.filter(t => !t.completed);
        const recentDiaries = appContext.diaries.slice(0, 5); // 🔥 최근 일기 5개만 읽어오기

        contextString = `
[MYos 앱 현재 상태 (호사님의 개인정보)]
- 오늘 날짜: ${appContext.todayStr}
- 총 누적 잔액: ${appContext.totalBalance}원
- 할 일 목록: ${JSON.stringify(pendingTodos.map(t => ({ text: t.text, date: t.date })))}
- 일정 목록: ${JSON.stringify(appContext.schedules)}
- 최근 일기 기록: ${JSON.stringify(recentDiaries.map(d => ({ date: d.date, content: d.content })))}

당신은 호사님의 최고급 개인 비서이자 심리 상담사인 '마이(Mai)'입니다.
1. 사용자가 기능(할 일 추가, 지출 추가, 일정 추가)을 요구하면 함수(Tool)를 정확히 호출하세요.
2. 사용자가 일상적인 대화를 하거나 감정을 털어놓으면, 최근 일기 기록을 참고하여 공감하고 전문적이면서도 다정한 톤으로 대화하세요. 
3. 기능 호출과 무관한 질문에는 친절하게 답변만 제공하세요.
`;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const response = await ai.models.generateContent({
        // 🔥 이 부분을 pro에서 다시 flash로 변경
        model: 'gemini-3.6-flash', 
        contents: `${contextString}\n\n사용자 요청: ${text}`,
        config: {
          tools: [{
            functionDeclarations: [
              {
                name: 'addTodo',
                description: '새로운 할 일(Todo)을 추가합니다.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: '할 일 내용' },
                    date: { type: Type.STRING, description: `날짜 (YYYY-MM-DD 형식). 오늘(${appContext?.todayStr}) 기준.` },
                    time: { type: Type.STRING, description: '시간 (HH:MM 형식)' }
                  },
                  required: ['text']
                }
              },
              {
                name: 'addExpense',
                description: '가계부에 수입이나 지출을 등록합니다.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER, description: '금액 (숫자, 예: 8000)' },
                    description: { type: Type.STRING, description: '지출 내용 (예: "커피", "버스비")' },
                    type: { type: Type.STRING, description: '지출이면 "expense", 수입이면 "income"' },
                    date: { type: Type.STRING, description: `날짜 (YYYY-MM-DD 형식). 오늘(${appContext?.todayStr}) 기준.` }
                  },
                  required: ['amount', 'description', 'type']
                }
              },
              {
                name: 'addSchedule',
                description: '캘린더에 새로운 일정을 추가합니다.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: '일정 제목' },
                    date: { type: Type.STRING, description: `날짜 (YYYY-MM-DD 형식). 오늘(${appContext?.todayStr}) 기준.` },
                    time: { type: Type.STRING, description: '시간 (HH:MM 형식)' }
                  },
                  required: ['title', 'date', 'time']
                }
              }
            ]
          }]
        }
      });

      // 🔥 마이가 어떤 함수를 호출했는지에 따라 다르게 작동
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        
        if (call.name === 'addTodo' && onAddTodo && call.args) {
          onAddTodo(call.args as any);
          setMessages([...newMessages, { sender: 'ai', text: `네! 📝 "${(call.args as any).text}" 할 일을 완벽하게 등록했습니다!` }]);
        } else if (call.name === 'addExpense' && onAddExpense && call.args) {
          onAddExpense(call.args as any);
          const typeStr = (call.args as any).type === 'income' ? '수입' : '지출';
          setMessages([...newMessages, { sender: 'ai', text: `네! 💰 ${(call.args as any).amount.toLocaleString()}원을 ${typeStr} 내역(${(call.args as any).description})으로 꼼꼼히 기록했습니다!` }]);
        } else if (call.name === 'addSchedule' && onAddSchedule && call.args) {
          onAddSchedule(call.args as any);
          setMessages([...newMessages, { sender: 'ai', text: `네! 📅 "${(call.args as any).title}" 일정을 캘린더에 잘 추가해 두었습니다!` }]);
        }
        setIsLoading(false);
        return;
      }

      const aiReply = response.text || '답변을 생성하지 못했습니다.';
      setMessages([...newMessages, { sender: 'ai', text: aiReply }]);
    } catch (error: any) {
      setMessages([...newMessages, { sender: 'ai', text: `오류 발생: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isActive) return null;

  if (!apiKey) {
    return (
      <section className="settings-page">
        <div className="page-title"><span>Myos</span><h1>AI 비서 마이 (Mai)</h1><p>구글 Gemini API 키를 입력해주세요.</p></div>
        <div className="settings-panel glass-panel">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="password" placeholder="API 키 입력 (AQ...)" value={inputKey} onChange={e => setInputKey(e.target.value)} style={{ flex: 1, padding: '12px' }} />
            <button className="primary-btn" onClick={saveApiKey}>저장</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="timer-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div className="page-title" style={{ flexShrink: 0, paddingBottom: '10px' }}>
        <span>Myos</span><h1>AI 비서 마이 (Mai) PRO</h1>
      </div>

      <div className="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
            {msg.text}
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-bubble ai typing">
            <div className="typing-indicator">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
        {isListening && <div style={{ alignSelf: 'center', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>🎙️ 듣고 있어요...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: '0', paddingTop: '12px' }}>
        <button onClick={startListening} style={{ background: isListening ? '#ff3b30' : 'var(--glass-bg)', border: 'none', borderRadius: '16px', padding: '0 16px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>🎙️</button>
        <input type="text" placeholder="마이에게 할 일, 지출, 일정을 편하게 말해보세요..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)', fontSize: '0.95rem' }} />
        <button className="primary-btn" onClick={sendMessage} style={{ borderRadius: '16px', padding: '0 20px' }}>전송</button>
      </div>
    </section>
  );
}