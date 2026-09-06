import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai'; // 🔥 1. 구글 전용 'Type' 부품 가져오기

interface AiAssistantProps {
  isActive: boolean;
  triggerHaptic: () => void;
  appContext?: {
    todos: any[];
    schedules: any[];
    balance: number;
    totalBalance: number;
    todayStr: string;
  };
  onAddTodo?: (data: { text: string; date?: string; time?: string }) => void;
}

type Message = { sender: 'user' | 'ai'; text: string };

export default function AiAssistant({ isActive, triggerHaptic, appContext, onAddTodo }: AiAssistantProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('myos-gemini-key') || '');
  const [inputKey, setInputKey] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '안녕하세요, 호사님! 당신의 개인 AI 비서 마이(Mai)입니다.\n\n"내일 오후 3시 시스템 프로그래밍 할 일 추가해줘" 처럼 명령하시면 제가 직접 등록해 드릴게요! ✨' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // 스크롤 맨 아래로 자동 이동
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
    if (!SpeechRecognition) { alert('이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 사용 권장)'); return; }
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
        contextString = `
[MYos 앱 현재 상태]
- 오늘 날짜: ${appContext.todayStr}
- 총 누적 잔액: ${appContext.totalBalance}원
- 할 일 목록: ${JSON.stringify(pendingTodos.map(t => ({ text: t.text, date: t.date })))}
- 일정 목록: ${JSON.stringify(appContext.schedules)}

당신은 친절한 AI 비서 '마이(Mai)'입니다. 사용자가 할 일을 추가해 달라고 요청하면 'addTodo' 함수를 호출하여 데이터를 직접 앱에 등록하세요. 내일, 모레 등의 날짜를 요청하면 위 '오늘 날짜'를 기준으로 계산해서 YYYY-MM-DD 형식으로 넘겨야 합니다.
`;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `${contextString}\n\n사용자 요청: ${text}`,
        config: {
          // 🔥 마이에게 부여하는 '명령어 가이드북(Tool)'
          tools: [{
            functionDeclarations: [{
              name: 'addTodo',
              description: '사용자의 요청에 따라 새로운 할 일(Todo)을 기기에 추가합니다.',
              parameters: {
                type: Type.OBJECT, // 🔥 2. 문자열 'OBJECT' 대신 Type.OBJECT 사용 (에러 해결)
                properties: {
                  text: { type: Type.STRING, description: '할 일 내용 (예: "C++ 과제 제출")' }, // 🔥 Type.STRING 사용
                  date: { type: Type.STRING, description: `날짜 (YYYY-MM-DD 형식). 오늘 날짜(${appContext?.todayStr})를 기준으로 판단.` },
                  time: { type: Type.STRING, description: '시간 (HH:MM 형식). 지정되지 않았으면 비워둠.' }
                },
                required: ['text']
              }
            }]
          }]
        }
      });

      // 🔥 마이가 '함수(행동)'를 호출했는지 감지
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        // 🔥 3. call.args가 텅 비어있지 않은지 &&로 한 번 더 검사 (5번째 에러 해결)
        if (call.name === 'addTodo' && onAddTodo && call.args) {
          onAddTodo(call.args as any); // 실제 앱에 데이터 등록
          setMessages([...newMessages, { sender: 'ai', text: `네! 호사님을 위해 📝 "${(call.args as any).text}" 할 일을 완벽하게 등록해 두었습니다!` }]);
          setIsLoading(false);
          return;
        }
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
        <span>Myos</span><h1>AI 비서 마이 (Mai)</h1>
      </div>

      <div className="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
            {msg.text}
          </div>
        ))}
        
        {/* 🔥 최신 트렌드: 타이핑 애니메이션 효과 */}
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
        <input type="text" placeholder="마이에게 할 일을 부탁해 보세요..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)', fontSize: '0.95rem' }} />
        <button className="primary-btn" onClick={sendMessage} style={{ borderRadius: '16px', padding: '0 20px' }}>전송</button>
      </div>
    </section>
  );
}