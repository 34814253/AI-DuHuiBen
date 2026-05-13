import { NavLink } from 'react-router-dom'

/** Figma node 4304:1425 — 底部 Tab 切图 */
const TAB = {
  barBg: '/home-figma/tab-bar-bg.svg',
  bookshelfIcon: '/home-figma/tab-bookshelf-active.png',
  scanCenter: '/home-figma/tab-scan-center.png',
  voiceIcon: '/home-figma/tab-voice-idle.png',
} as const

export function BottomTabBar() {
  return (
    <nav
      className="relative z-20 mx-auto w-full max-w-[375px] shrink-0 pb-[env(safe-area-inset-bottom)]"
      aria-label="主导航"
    >
      <div className="relative h-[99px] w-full">
        <img alt="" className="pointer-events-none absolute inset-0 block size-full max-w-none" src={TAB.barBg} />

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `group absolute left-[48px] top-[26px] flex w-[30px] flex-col items-center gap-[4px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F3A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isActive ? '' : 'opacity-[0.55] grayscale'
            }`
          }
        >
          <div className="flex h-[30px] w-full flex-col items-start px-px py-[2px]">
            <div className="relative h-[26px] w-[28px] shrink-0 overflow-hidden">
              <img
                alt=""
                className="pointer-events-none absolute max-w-none"
                src={TAB.bookshelfIcon}
                style={{
                  height: '122.22%',
                  width: '128.81%',
                  left: '-13.56%',
                  top: '-9.26%',
                }}
              />
            </div>
          </div>
          <span className="w-full text-center font-['PingFang_SC',sans-serif] text-[10px] font-normal not-italic leading-normal text-[#676b73] group-aria-[current=page]:font-semibold group-aria-[current=page]:text-[#1c1c1c]">
            书架
          </span>
        </NavLink>

        <NavLink
          to="/scan"
          className={({ isActive }) =>
            `absolute left-[150px] top-[2px] block size-[76px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F3A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isActive ? 'brightness-[1.06]' : 'opacity-90'
            }`
          }
        >
          <img alt="" className="pointer-events-none size-full max-w-none object-cover" src={TAB.scanCenter} />
        </NavLink>

        <NavLink
          to="/voice-record"
          className={({ isActive }) =>
            `group absolute left-[293px] top-[28px] flex w-[40px] flex-col items-center gap-[2px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F3A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isActive ? 'brightness-110' : ''
            }`
          }
        >
          <div className="flex size-[30px] shrink-0 items-start p-[2px]">
            <div className="relative size-[26px] shrink-0">
              <img
                alt=""
                className="pointer-events-none absolute inset-0 size-full max-w-none object-cover group-aria-[current=page]:opacity-100 opacity-90"
                src={TAB.voiceIcon}
              />
            </div>
          </div>
          <span className="min-w-full shrink-0 text-center font-['PingFang_SC',sans-serif] text-[10px] font-normal not-italic leading-normal text-[#676b73] group-aria-[current=page]:font-semibold group-aria-[current=page]:text-[#1c1c1c]">
            音色克隆
          </span>
        </NavLink>
      </div>
    </nav>
  )
}
