import React, { useState } from 'react';

// C언어의 구조체나 함수 매개변수 선언처럼, 본사(App.tsx)에서 받아올 데이터의 타입을 정의합니다.
type Launcher = { id: number; name: string; url: string };

interface LauncherPageProps {
  isActive: boolean;
  launchers: Launcher[];
  setLaunchers: React.Dispatch<React.SetStateAction<Launcher[]>>;
  triggerHaptic: () => void;
}

export default function LauncherPage({ isActive, launchers, setLaunchers, triggerHaptic }: LauncherPageProps) {
  // 런처 추가용 입력창 상태는 이 페이지 안에서만 쓰이므로 여기에 둡니다.
  const [newLauncherName, setNewLauncherName] = useState('');
  const [newLauncherUrl, setNewLauncherUrl] = useState('');

  const addLauncher = () => {
    triggerHaptic();
    let url = newLauncherUrl.trim();
    if (!newLauncherName.trim() || !url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    
    const launcher: Launcher = { id: Date.now(), name: newLauncherName.trim(), url };
    setLaunchers(curr => [...curr, launcher]);
    setNewLauncherName('');
    setNewLauncherUrl('');
  };

  const deleteLauncher = (id: number, e: React.MouseEvent) => {
    triggerHaptic();
    e.stopPropagation();
    setLaunchers(curr => curr.filter(l => l.id !== id));
  };

  if (!isActive) return null;

  return (
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
            <div className="launcher-content">
              <span className="launcher-name">{launcher.name}</span>
              <span className="launcher-url">{launcher.url.replace(/^https?:\/\//, '')}</span>
            </div>
            <button className="launcher-delete" onClick={(e) => deleteLauncher(launcher.id, e)}>✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}