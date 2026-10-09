// Стили приложения (тёмная и светлая темы).
/* eslint-disable no-unused-vars */

export const CSS = `
:root{--accent:#FF9F0A;--accent-rgb:255,159,10}
/* hidden timer mode: hide at once (children with transition:all would otherwise fade the visibility out) */
.tm-hidden,.tm-hidden *{visibility:hidden!important;transition:none!important}
.action-card:active{transform:scale(0.98)}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:#000;margin:0}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
.app{background:#000;min-height:100vh;color:white;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;max-width:480px;margin:0 auto;padding-bottom:90px}
.header{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(24px);z-index:50}
.header-logo{width:30px;height:30px;border-radius:8px;object-fit:cover}
.header h1{font-size:20px;font-weight:700;letter-spacing:-0.3px;margin-left:9px}
.header-left{display:flex;align-items:center}
.streak-badge{background:rgba(var(--accent-rgb),0.12);border:1px solid rgba(var(--accent-rgb),0.3);border-radius:20px;padding:4px 11px;font-size:13px;font-weight:700;color:var(--accent)}
.onboard-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
.onboard-card{background:#111;border-radius:24px;padding:32px 24px;text-align:center;max-width:360px;width:100%;border:1px solid rgba(255,255,255,0.08)}
.onboard-emoji{font-size:60px;margin-bottom:18px;display:block}
.onboard-title{font-size:26px;font-weight:800;margin-bottom:10px}
.onboard-sub{font-size:14px;opacity:0.5;line-height:1.6;margin-bottom:24px}
.onboard-features{text-align:left;margin-bottom:24px;display:flex;flex-direction:column;gap:12px}
.onboard-feature{display:flex;align-items:center;gap:12px;font-size:14px;opacity:0.75}
.onboard-btn{width:100%;padding:16px;background:#fff;border:none;border-radius:16px;font-size:16px;font-weight:700;color:#000;cursor:pointer}
.section{padding:20px 20px}
.date-label{font-size:13px;opacity:0.35;font-weight:500;margin-bottom:16px;text-transform:capitalize;letter-spacing:0.1px}
.back-btn{background:#1c1c1e;border:none;color:rgba(255,255,255,0.7);font-size:14px;font-weight:600;cursor:pointer;padding:8px 14px;display:inline-flex;align-items:center;gap:6px;border-radius:99px;transition:all 0.15s}.back-btn:active{background:#2c2c2e;color:white}
.ex-selector-btn{width:100%;background:#1c1c1e;border:none;border-radius:14px;padding:16px 18px;color:white;font-size:16px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left;margin-bottom:20px}
.ex-selector-btn:active{background:#2c2c2e}
.ex-header{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.ex-image{width:80px;height:80px;border-radius:16px;object-fit:cover;flex-shrink:0}
.ex-title{font-size:22px;font-weight:700;letter-spacing:-0.3px}
.fav-section{display:flex;align-items:center;justify-content:space-between;margin:0 0 20px;padding:14px 16px;background:#1c1c1e;border-radius:14px}
.fav-section-label{font-size:11px;opacity:0.35;font-weight:500;text-transform:uppercase;letter-spacing:0.5px}
.fav-section-name{font-size:14px;font-weight:600;margin-top:2px}
.fav-big-btn{background:#2c2c2e;border:none;border-radius:12px;padding:10px 16px;font-size:20px;cursor:pointer;transition:all 0.15s}
.fav-big-btn.active{background:rgba(255,200,0,0.15)}
.last-hint{background:#1c1c1e;border:none;border-radius:14px;padding:12px 16px;margin:0 0 20px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6}
.sets-lbl{font-size:13px;font-weight:600;opacity:0.35;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px}
.set-row{display:flex;gap:10px;margin-bottom:16px;align-items:flex-end}
.set-num{opacity:0.25;width:18px;font-size:13px;font-weight:500;flex-shrink:0;text-align:center;padding-bottom:14px}
.set-sep{opacity:0.2;flex-shrink:0;font-size:16px;padding-bottom:14px}
.dpicker-wrap{flex:1;position:relative;z-index:10}.dpicker-wrap.is-open{z-index:200}
.dpicker-label{font-size:11px;font-weight:600;opacity:0.35;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
.dpicker-btn{width:100%;background:#1c1c1e;border:1.5px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 14px;color:white;font-size:17px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left}
.dpicker-btn.open{border-color:rgba(var(--accent-rgb),0.5);background:#1c1c1e}
.dpicker-btn:active{background:#2c2c2e}
.dpicker-unit{font-size:13px;opacity:0.45;font-weight:500}
.dpicker-chevron{opacity:0.4;font-size:18px;transition:transform 0.2s}
.dpicker-btn.open .dpicker-chevron{transform:rotate(180deg);opacity:0.7}
.dpicker-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#2c2c2e;border-radius:14px;max-height:220px;overflow-y:auto;z-index:300;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08)}
.dpicker-opt{padding:13px 16px;font-size:17px;font-weight:500;cursor:pointer;transition:background 0.1s;color:rgba(255,255,255,0.75)}
.dpicker-opt:hover{background:rgba(255,255,255,0.06)}
.dpicker-opt.active{color:var(--accent);font-weight:700;background:rgba(var(--accent-rgb),0.08)}
.dpicker-opt-unit{font-size:13px;opacity:0.45}
.set-btns{display:flex;gap:10px;margin:10px 0 24px}
.set-btn{flex:1;padding:12px;background:#1c1c1e;border:none;border-radius:12px;color:rgba(255,255,255,0.7);font-size:14px;font-weight:500;cursor:pointer;transition:all 0.15s}
.set-btn:active{background:#2c2c2e}
.timer-card{background:linear-gradient(135deg,rgba(var(--accent-rgb),0.1),rgba(var(--accent-rgb),0.05));border:1px solid rgba(var(--accent-rgb),0.2);border-radius:20px;padding:16px 18px;margin-bottom:20px;display:flex;align-items:center;gap:14px}
.timer-card.idle{background:#1c1c1e;border:1px solid rgba(255,255,255,0.06)}
.timer-lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.5;margin-bottom:4px}
.timer-num{font-size:40px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums;letter-spacing:-2px;line-height:1}
.timer-skip{background:rgba(var(--accent-rgb),0.15);border:1px solid rgba(var(--accent-rgb),0.25);border-radius:12px;padding:10px 16px;color:var(--accent);font-size:14px;font-weight:700;cursor:pointer;flex-shrink:0}
.timer-start{background:var(--accent);border:none;border-radius:12px;padding:10px 18px;color:#000;font-size:14px;font-weight:700;cursor:pointer;flex-shrink:0}
.back-btn{font-family:inherit;cursor:pointer;line-height:1}
.save-btn{width:100%;padding:16px;background:var(--accent);border:none;border-radius:16px;font-size:17px;font-weight:700;color:#000;cursor:pointer;transition:all 0.2s;letter-spacing:-0.2px}
.save-btn:active{background:#28B84A}
.save-btn.done{background:var(--accent)}
.day-group{margin-bottom:4px}
.day-hdr{width:100%;background:#1c1c1e;border:none;border-radius:14px;padding:14px 16px;color:white;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left;margin-bottom:2px}
.day-hdr:active{background:#2c2c2e}
.day-hdr.open{border-radius:14px 14px 0 0}
.day-chev{opacity:0.3;transition:transform 0.2s;font-size:12px;flex-shrink:0}
.day-chev.open{transform:rotate(180deg);opacity:0.6}
.day-body{background:#1c1c1e;border-radius:0 0 14px 14px;overflow:hidden;margin-bottom:2px}
.day-actions{display:flex;border-bottom:1px solid rgba(255,255,255,0.05)}
.day-action-btn{flex:1;padding:10px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}
.day-action-btn:hover{color:rgba(255,255,255,0.8)}
.day-action-btn.ok{color:var(--accent)}
.day-action-btn+.day-action-btn{border-left:1px solid rgba(255,255,255,0.05)}
.day-action-btn.del{color:rgba(255,59,48,0.7)}
.day-action-btn.del:hover{color:#FF453A}
.hist-card{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04)}
.hist-card:last-child{border-bottom:none}
.hist-ex{font-size:14px;font-weight:600;margin-bottom:7px}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{padding:4px 10px;border-radius:99px;background:#2c2c2e;font-size:12px;font-weight:600;color:rgba(255,255,255,0.7)}
.stats-row{display:flex;gap:8px;margin-bottom:24px}
.stat-card{flex:1;background:#1c1c1e;border:none;border-radius:16px;padding:16px 10px;text-align:center}
.stat-val{font-size:22px;font-weight:700;letter-spacing:-0.5px}
.stat-lbl{font-size:10px;opacity:0.4;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px;font-weight:500}
.prog-title{font-size:17px;font-weight:700;margin:24px 0 12px;letter-spacing:-0.3px}
.chart-wrap{background:#1c1c1e;border:none;border-radius:16px;padding:16px;margin-bottom:8px}
.chart-ex-select{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:10px 14px;color:white;font-size:14px;font-weight:500;outline:none;margin-bottom:14px;cursor:pointer;-webkit-appearance:none;appearance:none}
.chart-ex-select option{background:#2c2c2e;color:white}
.chart-nodata{text-align:center;opacity:0.35;font-size:14px;padding:30px 0}
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.cal-btn{background:#1c1c1e;border:none;border-radius:10px;padding:8px 16px;color:rgba(255,255,255,0.6);cursor:pointer;font-size:15px;font-weight:500}
.cal-mname{font-size:16px;font-weight:700;letter-spacing:-0.3px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:24px}
.cal-dow{text-align:center;font-size:10px;opacity:0.3;font-weight:600;padding-bottom:6px}
.cal-cell{aspect-ratio:1;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:500;background:#1c1c1e;color:rgba(255,255,255,0.6)}
.cal-cell.empty{background:transparent}
.cal-cell.trained{background:rgba(var(--accent-rgb),0.15);color:var(--accent);cursor:pointer;font-weight:700}
.cal-cell.trained:active{background:rgba(var(--accent-rgb),0.25)}
.cal-cell.today{box-shadow:0 0 0 1.5px rgba(255,255,255,0.3)}
.cal-vol{font-size:7px;opacity:0.65;margin-top:1px}
.pr-group{margin-bottom:4px}
.pr-hdr{width:100%;background:#1c1c1e;border:none;border-radius:14px;padding:13px 16px;color:white;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all 0.15s;text-align:left;margin-bottom:2px}
.pr-hdr:active{background:#2c2c2e}
.pr-hdr.open{border-radius:14px 14px 0 0}
.pr-hdr-left{display:flex;align-items:center;gap:12px}
.pr-thumb{width:38px;height:38px;border-radius:10px;object-fit:cover;flex-shrink:0}
.pr-thumb-ph{width:38px;height:38px;border-radius:10px;background:#2c2c2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.pr-name{font-size:15px;font-weight:600}
.pr-val{font-size:17px;font-weight:700;color:var(--accent)}
.pr-detail{background:#1c1c1e;border-top:1px solid rgba(255,255,255,0.05);border-radius:0 0 14px 14px;padding:14px 16px;display:flex;gap:14px;margin-bottom:2px}
.pr-detail-img{width:70px;border-radius:12px;flex-shrink:0;object-fit:cover}
.pr-detail-sets{font-size:16px;font-weight:700}
.pr-detail-date{font-size:12px;opacity:0.4;margin-top:3px}
.pr-detail-est{font-size:13px;color:var(--accent);margin-top:4px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:flex-end;justify-content:center;animation:fov 0.2s ease;backdrop-filter:blur(8px);padding-bottom:env(keyboard-inset-height,0px)}
@keyframes fov{from{opacity:0}to{opacity:1}}
.modal{background:#1c1c1e;border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:85vh;max-height:85dvh;display:flex;flex-direction:column;animation:sup 0.3s cubic-bezier(0.34,1.1,0.64,1)}
@keyframes sup{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:99px;margin:10px auto 0;flex-shrink:0}
.modal-hdr{padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;position:sticky;top:0;background:#1c1c1e;z-index:1}
.modal-title{font-size:17px;font-weight:700;margin-bottom:12px}
.modal-srch-wrap{position:relative}
.modal-srch-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:0.35}
.modal-srch{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:10px 14px 10px 36px;color:white;font-size:15px;outline:none;font-weight:400}
.modal-srch::placeholder{color:rgba(255,255,255,0.3)}
.modal-list{overflow-y:auto;padding:6px 10px 30px;flex:1}
.modal-sect-lbl{font-size:11px;font-weight:600;opacity:0.35;text-transform:uppercase;letter-spacing:0.8px;padding:12px 10px 4px}
.modal-item{padding:12px 10px;border-radius:12px;cursor:pointer;font-size:15px;font-weight:500;display:flex;align-items:center;gap:20px;transition:background 0.1s}
.modal-item:active{background:rgba(255,255,255,0.06)}
.modal-img{width:36px;height:36px;border-radius:8px;object-fit:cover;flex-shrink:0}
.modal-ph{width:36px;height:36px;border-radius:8px;background:#2c2c2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.modal-body{padding:16px 18px 30px;overflow-y:auto;flex:1}
.edit-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.edit-inp{flex:1;background:#2c2c2e;border:none;border-radius:10px;padding:11px;color:white;font-size:16px;font-weight:600;text-align:center;outline:none}
.edit-del{background:rgba(255,59,48,0.1);border:none;border-radius:10px;padding:11px 14px;color:#FF453A;cursor:pointer;font-size:14px}
.edit-save-btn{width:100%;padding:14px;background:var(--accent);border:none;border-radius:14px;font-size:16px;font-weight:700;color:#000;cursor:pointer;margin-top:14px}
.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:480px;background:rgba(0,0,0,0.9);border-top:1px solid rgba(255,255,255,0.06);display:flex;padding:10px 0 26px;z-index:50;backdrop-filter:blur(24px)}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:opacity 0.15s;padding:4px 0}
.nav-icon{font-size:22px}
.nav-lbl{font-size:10px;font-weight:600;letter-spacing:0.2px}
@media(max-width:480px){.nav-bar{width:100%}}
.timer-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:150;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(8px);animation:fov 0.2s ease}
.timer-modal{background:#1c1c1e;color:#fff;border-radius:24px 24px 0 0;width:100%;max-width:480px;padding:0 0 40px;animation:sup 0.3s cubic-bezier(0.34,1.1,0.64,1)}
.timer-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:24px}
.timer-tab{flex:1;padding:14px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;position:relative}
.timer-tab.active{color:white}
.timer-tab.active::after{content:"";position:absolute;bottom:0;left:20%;right:20%;height:2px;background:var(--accent);border-radius:99px}
.timer-icon-btn{background:none;border:none;cursor:pointer;font-size:20px;padding:4px 6px;opacity:0.7;transition:opacity 0.15s}
.timer-icon-btn:hover{opacity:1}
.timer-big-num{font-size:72px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-3px;text-align:center;margin:16px 0}
.timer-controls{display:flex;gap:12px;padding:0 24px;justify-content:center}
.timer-ctrl-btn{flex:1;padding:14px;border:none;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;max-width:160px}
.timer-ctrl-btn.primary{background:var(--accent);color:#000}
.timer-ctrl-btn.secondary{background:#2c2c2e;color:white}
.timer-ctrl-btn.danger{background:rgba(255,59,48,0.15);color:#FF453A}
.alert-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:300;background:#1c1c1e;color:#fff;border-radius:20px;padding:16px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);animation:toastIn 0.4s cubic-bezier(0.34,1.2,0.64,1);min-width:280px;max-width:360px}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.alert-toast-icon{font-size:32px;flex-shrink:0}
.alert-toast-title{font-size:15px;font-weight:800;margin-bottom:2px}
.alert-toast-sub{font-size:13px;opacity:0.5}
.auth-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:#000}
.auth-card{width:100%;max-width:380px;background:#1c1c1e;border-radius:24px;padding:32px 24px}
.auth-logo{width:64px;height:64px;border-radius:16px;object-fit:cover;margin:0 auto 20px;display:block}
.auth-logo-ph{width:64px;height:64px;border-radius:16px;background:#2c2c2e;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px}
.auth-title{font-size:28px;font-weight:800;text-align:center;margin-bottom:6px;letter-spacing:-0.5px;color:#fff}
.auth-sub{font-size:14px;color:rgba(255,255,255,0.6);text-align:center;margin-bottom:28px}
.auth-inp-lbl{font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
.auth-inp{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:14px 16px;color:white;font-size:16px;outline:none;margin-bottom:14px}
.auth-inp:focus{box-shadow:0 0 0 2px rgba(var(--accent-rgb),0.4)}
.auth-btn{width:100%;padding:15px;background:var(--accent);border:none;border-radius:14px;font-size:16px;font-weight:700;color:#000;cursor:pointer;margin-top:4px;transition:opacity 0.15s}
.auth-btn:disabled{opacity:0.5}
.auth-err{background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.25);border-radius:10px;padding:10px 14px;font-size:13px;color:#FF453A;margin-bottom:14px;text-align:center}
.auth-switch{text-align:center;margin-top:18px;font-size:14px;color:rgba(255,255,255,0.6)}
.auth-switch button{background:none;border:none;color:var(--accent);font-size:14px;font-weight:600;cursor:pointer;padding:0;margin-left:4px}
.auth-user-bar{display:flex;align-items:center;gap:8px}
.auth-signout{background:none;border:none;color:rgba(255,255,255,0.35);font-size:12px;cursor:pointer;padding:4px 8px;border-radius:8px}
.auth-signout:hover{color:rgba(255,255,255,0.7)}
.settings-card{background:rgba(255,255,255,0.05);border-radius:16px;padding:18px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.08)}
.settings-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;opacity:0.4;margin-bottom:14px}
.settings-inp{width:100%;background:#2c2c2e;border:none;border-radius:12px;padding:12px 14px;color:white;font-size:15px;outline:none;font-weight:500}
.settings-inp:focus{box-shadow:0 0 0 2px rgba(var(--accent-rgb),0.4)}
.settings-inp::placeholder{color:rgba(255,255,255,0.25)}
.settings-row{display:flex;align-items:center;justify-content:space-between;padding:2px 0}
.settings-row-label{font-size:14px;font-weight:500}
.settings-toggle{display:flex;gap:3px;background:rgba(255,255,255,0.08);border-radius:10px;padding:3px}
.settings-toggle-btn{padding:5px 14px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.15s;background:transparent;color:rgba(255,255,255,0.5)}
.settings-toggle-btn.active{background:var(--accent);color:#000}
.settings-action-btn{width:100%;padding:13px 16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:rgba(255,255,255,0.8);font-size:14px;font-weight:600;cursor:pointer;text-align:left;transition:all 0.15s;margin-bottom:8px;display:flex;align-items:center;gap:10px}
.settings-action-btn:active{background:rgba(255,255,255,0.12)}
.settings-action-btn:last-child{margin-bottom:0}
.settings-action-btn.danger{color:#FF453A;background:rgba(255,59,48,0.08);border-color:rgba(255,59,48,0.2)}
.settings-action-btn.danger:active{background:rgba(255,59,48,0.15)}
.settings-signout-btn{width:100%;padding:14px;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.25);border-radius:14px;color:#FF453A;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.15s}
.settings-signout-btn:active{background:rgba(255,59,48,0.2)}
.ex-tab-search{width:100%;background:#2c2c2e;border:none;border-radius:14px;padding:12px 16px 12px 40px;color:white;font-size:15px;outline:none;margin-bottom:14px}
.ex-tab-search::placeholder{color:rgba(255,255,255,0.3)}
.muscle-filters{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.muscle-filters-fav-row{display:flex}
.muscle-chip-fav{padding:7px 16px;border-radius:99px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.15s;background:#2c2c2e;color:rgba(255,255,255,0.5)}
.muscle-chip-fav.active{background:var(--accent);color:#000;border:none}
.muscle-filters-divider{height:1px;background:rgba(255,255,255,0.08);margin:4px 0}
.muscle-filters-row{display:flex;gap:6px;flex-wrap:nowrap}
.muscle-chip{flex-shrink:0;padding:6px 10px;border-radius:99px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.15s;background:#2c2c2e;color:rgba(255,255,255,0.5)}
.muscle-chip.active{background:var(--accent);color:#000}
.ex-list-item{display:flex;align-items:center;gap:20px;padding:11px 14px;border-radius:14px;cursor:pointer;transition:background 0.12s;margin-bottom:4px}
.ex-list-item:active{background:rgba(255,255,255,0.08)}
.ex-list-img{width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;background:#2c2c2e}
.ex-list-ph{width:44px;height:44px;border-radius:10px;background:#2c2c2e;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.ex-list-name{font-size:15px;font-weight:600;flex:1}
.ex-detail-img{width:120px;height:120px;border-radius:20px;object-fit:cover;display:block;margin:0 auto 16px}
.ex-detail-ph{width:120px;height:120px;border-radius:20px;background:#2c2c2e;display:flex;align-items:center;justify-content:center;font-size:48px;margin:0 auto 16px}
.ex-detail-muscles{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 18px}
.ex-detail-muscle-tag{padding:4px 12px;border-radius:99px;background:rgba(var(--accent-rgb),0.12);color:var(--accent);font-size:12px;font-weight:700}
.ex-detail-muscle-tag-secondary{padding:3px 10px;border-radius:99px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);font-size:11px;font-weight:500}
.ex-detail-section{margin-bottom:16px}
.ex-detail-section-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;opacity:0.4;margin-bottom:6px}
.ex-detail-text{font-size:14px;line-height:1.65;opacity:0.75}`

export const LIGHT_CSS = `
body{background:#f2f2f7}
.app[data-theme="light"]{background:#f2f2f7;color:#1c1c1e}
.app[data-theme="light"] .header{background:rgba(242,242,247,0.92);border-color:rgba(0,0,0,0.08)}
.app[data-theme="light"] .header h1{color:#1c1c1e}
.app[data-theme="light"] .onboard-card{background:#fff;border-color:rgba(0,0,0,0.08)}
.app[data-theme="light"] .date-label{color:rgba(0,0,0,0.35)}
.app[data-theme="light"] .back-btn{background:#fff;color:rgba(0,0,0,0.7)}.app[data-theme="light"] .back-btn:active{background:#f2f2f7;color:#1c1c1e}
.app[data-theme="light"] .ex-selector-btn{background:#fff;color:#1c1c1e}.app[data-theme="light"] .ex-selector-btn:active{background:#f2f2f7}
.app[data-theme="light"] .fav-section{background:#fff}.app[data-theme="light"] .fav-section-name{color:#1c1c1e}
.app[data-theme="light"] .fav-big-btn{background:#f2f2f7}
.app[data-theme="light"] .last-hint{background:#fff;color:rgba(0,0,0,0.6)}
.app[data-theme="light"] .sets-lbl{color:rgba(0,0,0,0.35)}
.app[data-theme="light"] .set-num{color:rgba(0,0,0,0.25)}
.app[data-theme="light"] .set-sep{color:rgba(0,0,0,0.2)}
.app[data-theme="light"] .set-btn{background:#fff;color:rgba(0,0,0,0.7)}.app[data-theme="light"] .set-btn:active{background:#f2f2f7}
.app[data-theme="light"] .dpicker-btn{background:#fff;border-color:rgba(0,0,0,0.1);color:#1c1c1e}
.app[data-theme="light"] .dpicker-btn.open{background:#fff;border-color:rgba(var(--accent-rgb),0.5)}.app[data-theme="light"] .dpicker-btn:active{background:#f2f2f7}
.app[data-theme="light"] .dpicker-dropdown{background:#fff;border-color:rgba(0,0,0,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.15)}
.app[data-theme="light"] .dpicker-opt{color:rgba(0,0,0,0.75)}.app[data-theme="light"] .dpicker-opt:hover{background:rgba(0,0,0,0.04)}
.app[data-theme="light"] .dpicker-opt.active{color:var(--accent);background:rgba(var(--accent-rgb),0.08)}
.app[data-theme="light"] .day-hdr{background:#fff;color:#1c1c1e}.app[data-theme="light"] .day-hdr:active{background:#f2f2f7}
.app[data-theme="light"] .day-chev{color:rgba(0,0,0,0.3)}
.app[data-theme="light"] .day-body{background:#fff}.app[data-theme="light"] .day-actions{border-color:rgba(0,0,0,0.05)}
.app[data-theme="light"] .day-action-btn{color:rgba(0,0,0,0.4)}.app[data-theme="light"] .day-action-btn:hover{color:rgba(0,0,0,0.8)}
.app[data-theme="light"] .day-action-btn.ok{color:var(--accent)}.app[data-theme="light"] .day-action-btn+.day-action-btn{border-color:rgba(0,0,0,0.05)}
.app[data-theme="light"] .hist-card{border-bottom-color:rgba(0,0,0,0.04)}
.app[data-theme="light"] .hist-ex{color:#1c1c1e}.app[data-theme="light"] .chip{background:#e5e5ea;color:#1c1c1e}
.app[data-theme="light"] .stat-card{background:#fff}.app[data-theme="light"] .stat-val{color:#1c1c1e}.app[data-theme="light"] .stat-lbl{color:rgba(0,0,0,0.4)}
.app[data-theme="light"] .prog-title{color:#1c1c1e}
.app[data-theme="light"] .chart-wrap{background:#fff}
.app[data-theme="light"] .chart-ex-select{background:#f2f2f7;color:#1c1c1e}.app[data-theme="light"] .chart-ex-select option{background:#f2f2f7;color:#1c1c1e}
.app[data-theme="light"] .chart-nodata{color:rgba(0,0,0,0.35)}
.app[data-theme="light"] .cal-btn{background:#fff;color:rgba(0,0,0,0.6)}
.app[data-theme="light"] .cal-mname{color:#1c1c1e}.app[data-theme="light"] .cal-dow{color:rgba(0,0,0,0.3)}
.app[data-theme="light"] .cal-cell{background:#fff;color:rgba(0,0,0,0.6)}.app[data-theme="light"] .cal-cell.empty{background:transparent}
.app[data-theme="light"] .modal{background:#fff}.app[data-theme="light"] .modal-handle{background:rgba(0,0,0,0.15)}
.app[data-theme="light"] .modal-hdr{background:#fff;border-color:rgba(0,0,0,0.06)}
.app[data-theme="light"] .modal-title{color:#1c1c1e}
.app[data-theme="light"] .modal-srch{background:#f2f2f7;color:#1c1c1e}.app[data-theme="light"] .modal-srch::placeholder{color:rgba(0,0,0,0.3)}
.app[data-theme="light"] .modal-item{color:#1c1c1e}.app[data-theme="light"] .modal-item:active{background:rgba(0,0,0,0.04)}
.app[data-theme="light"] .modal-ph{background:#f2f2f7}.app[data-theme="light"] .modal-body{background:#fff}.app[data-theme="light"] .modal-sect-lbl{color:rgba(0,0,0,0.35)}
.app[data-theme="light"] .edit-inp{background:#f2f2f7;color:#1c1c1e}
.app[data-theme="light"] .nav-bar{background:rgba(255,255,255,0.95);border-top-color:rgba(0,0,0,0.08)}
.app[data-theme="light"] .settings-card{background:#fff!important;border-color:rgba(0,0,0,0.08)!important}
.app[data-theme="light"] .settings-section-title{color:rgba(0,0,0,0.4)!important}
.app[data-theme="light"] .settings-inp{background:#f2f2f7!important;color:#1c1c1e!important}
.app[data-theme="light"] .settings-row-label{color:#1c1c1e!important}
.app[data-theme="light"] .settings-toggle{background:rgba(0,0,0,0.06)!important}
.app[data-theme="light"] .settings-toggle-btn{color:rgba(0,0,0,0.5)!important}
.app[data-theme="light"] .settings-toggle-btn.active{background:var(--accent)!important;color:#000!important}
.app[data-theme="light"] .settings-action-btn{background:rgba(0,0,0,0.04)!important;border-color:rgba(0,0,0,0.08)!important;color:rgba(0,0,0,0.8)!important}
.app[data-theme="light"] .settings-action-btn.danger{color:#FF453A!important;background:rgba(255,59,48,0.06)!important;border-color:rgba(255,59,48,0.15)!important}
.app[data-theme="light"] .settings-signout-btn{background:rgba(255,59,48,0.08)!important;border-color:rgba(255,59,48,0.2)!important}
.app[data-theme="light"] .ex-tab-search{background:#f2f2f7!important;color:#1c1c1e!important}
.app[data-theme="light"] .ex-tab-search::placeholder{color:rgba(0,0,0,0.3)!important}
.app[data-theme="light"] .muscle-chip{background:#e5e5ea!important;color:rgba(0,0,0,0.5)!important}
.app[data-theme="light"] .muscle-chip.active{background:var(--accent)!important;color:#000!important}
.app[data-theme="light"] .muscle-chip-fav{background:#e5e5ea!important;color:rgba(0,0,0,0.5)!important}
.app[data-theme="light"] .muscle-chip-fav.active{background:var(--accent)!important;color:#000!important}
.app[data-theme="light"] .muscle-filters-divider{background:rgba(0,0,0,0.08)!important}
.app[data-theme="light"] .ex-list-item:active{background:rgba(0,0,0,0.04)!important}
.app[data-theme="light"] .ex-list-img{background:#e5e5ea!important}
.app[data-theme="light"] .ex-list-ph{background:#e5e5ea!important}
.app[data-theme="light"] .ex-list-name{color:#1c1c1e!important}
.app[data-theme="light"] .ex-detail-ph{background:#e5e5ea!important}
`

export const CSS_ALL = CSS + LIGHT_CSS
