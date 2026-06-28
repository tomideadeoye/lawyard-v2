import { getAllSettings, updateSetting, type SettingEntry } from '@/lib/admin/api'
import { revalidatePath } from 'next/cache'

async function updateSettings(formData: FormData) {
  'use server'
  const errors: string[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('$') || key === 'submit') continue
    try {
      await updateSetting(key, value as string)
    } catch (e) {
      errors.push(`${key}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }
  if (errors.length > 0) {
    console.error('Settings update errors:', errors)
  }
  revalidatePath('/admin/settings')
}

export default async function SettingsPage() {
  let settings: SettingEntry[] = []
  try {
    settings = await getAllSettings()
  } catch {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-red-500">Failed to load settings. Make sure the <code>app_settings</code> table exists.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-8">
        Configuration stored in the database — no code changes needed.
      </p>

      <form action={updateSettings} className="space-y-6">
        <div className="space-y-4">
          {settings.map((s) => (
            <div key={s.key} className="border border-slate-200 rounded-lg p-4">
              <label
                htmlFor={`setting-${s.key}`}
                className="block text-sm font-semibold text-slate-700 mb-1"
              >
                {s.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </label>
              {s.description && (
                <p className="text-xs text-slate-400 mb-2">{s.description}</p>
              )}
              <input
                id={`setting-${s.key}`}
                name={s.key}
                type="text"
                defaultValue={s.value}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/40 focus:border-[#a77c5c]"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-[#a77c5c] text-white rounded-lg text-sm font-semibold hover:bg-[#8e6a4f] transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  )
}
