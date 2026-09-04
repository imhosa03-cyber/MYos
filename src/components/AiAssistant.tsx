import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

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
}

type Message = { sender: 'user' | 'ai'; text: string };

export default function AiAssistant({ isActive, triggerHaptic, appContext }: AiAssistantProps) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('myos-gemini-key') || '');
  const [inputKey, setInputKey] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '안녕하세요, 호사님! 당신의 개인 AI 비서 마이(Mai)입니다. 오늘 할 일이나 잔액, 일정을 편하게 물어보세요!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const saveApiKey = () => {
    triggerHaptic();
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    localStorage.setItem('myos-gemini-key', trimmed);
    setApiKey(trimmed);
    setInputKey('');
    alert('API 키가 안전하게 저장되었습니다!');
  };

  // 음성 인식 (Speech-to-Text) 함수
  const startListening = () => {
    triggerHaptic();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 브라우저를 이용해 주세요)');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setInputMessage(speechText);
    };

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
[현재 사용자 앱 데이터 (MYos)]
- 오늘 날짜: ${appContext.todayStr}
- 총 누적 잔액: ${appContext.totalBalance.toLocaleString()}원
- 이달 잔액: ${appContext.balance.toLocaleString()}원
- 남은 할 일 개수: ${pendingTodos.length}개
- 할 일 목록: ${JSON.stringify(pendingTodos.map(t => ({ text: t.text, date: t.date, time: t.time, priority: t.priority })))}
- 다가오는 일정 목록: ${JSON.stringify(appContext.schedules)}

※ 위 데이터는 사용자가 현재 사용 중인 MYos 앱의 실제 정보입니다. 사용자가 질문할 때 마이(Mai)로서 친절하고 정확하게 답변해주세요.
`;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const fullPrompt = `${contextString}\n\n사용자 질문: ${text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
      });

      const aiReply = response.text || '답변을 생성하지 못했습니다.';
      setMessages([...newMessages, { sender: 'ai', text: aiReply }]);
    } catch (error: any) {
      console.error(error);
      setMessages([...newMessages, { sender: 'ai', text: `오류 발생: ${error.message || 'API 키를 확인해 주세요.'}` }]);
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
          <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>🔑 API 키 연동</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Google AI Studio에서 발급받은 무료 API 키를 입력하면 MYos 안에서 AI 마이와 대화할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="password" 
              placeholder="API 키 입력 (AQ...)" 
              value={inputKey} 
              onChange={e => setInputKey(e.target.value)} 
              style={{ flex: 1, padding: '12px' }} 
            />
            <button className="primary-btn" onClick={saveApiKey}>저장</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="timer-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div className="page-title" style={{ flexShrink: 0 }}>
        <span>Myos</span>
        <h1>AI 비서 마이 (Mai)</h1>
        <p>음성과 앱 데이터를 읽어오는 스마트 비서</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', marginBottom: '12px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: '16px',
            background: msg.sender === 'user' ? 'var(--primary-color)' : 'rgba(150,150,150,0.15)',
            color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
            fontSize: '0.95rem',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap'
          }}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '8px' }}>마이가 생각 중입니다...</div>}
        {isListening && <div style={{ alignSelf: 'center', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>🎙️ 음성을 듣고 있어요... 말씀하세요!</div>}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: '0', paddingTop: '8px' }}>
        <button 
          onClick={startListening} 
          style={{ 
            background: isListening ? '#ff3b30' : 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px', 
            padding: '0 14px', 
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
          title="음성으로 입력하기"
        >
          🎙️
        </button>
        <input 
          type="text" 
          placeholder="마이에게 물어보세요 (예: 나 오늘 뭐 해야 돼?)..." 
          value={inputMessage} 
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
        />
        <button className="primary-btn" onClick={sendMessage} style={{ padding: '0 20px' }}>전송</button>
      </div>
    </section>
  );
}