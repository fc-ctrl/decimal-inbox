import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Inbox, Settings, LogOut, Mail, Tag, PenTool } from 'lucide-react'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Inbox size={22} className="text-primary" />
            <span className="text-lg font-semibold">
              <span className="text-primary">Decimal</span>{' '}
              <span className="font-light text-text-secondary">Inbox</span>
            </span>
            <span className="text-[10px] text-text-muted bg-gray-100 px-1.5 py-0.5 rounded-full">v0.5.2</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-secondary hover:bg-gray-50'
              }`
            }
          >
            <Mail size={18} />
            Inbox
          </NavLink>
          <NavLink
            to="/compose"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-secondary hover:bg-gray-50'
              }`
            }
          >
            <PenTool size={18} />
            Composer
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-secondary hover:bg-gray-50'
              }`
            }
          >
            <Tag size={18} />
            Catégories
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary font-medium'
                  : 'text-text-secondary hover:bg-gray-50'
              }`
            }
          >
            <Settings size={18} />
            Paramètres
          </NavLink>
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-text-muted truncate">{profile?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-text-muted hover:text-danger transition-colors"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
