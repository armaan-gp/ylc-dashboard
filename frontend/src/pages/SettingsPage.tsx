import { useState } from 'react';
import toast from 'react-hot-toast';
import client from '@/api/client';
import { PRESETS, useThemeStore } from '@/store/themeStore';

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const { activePresetId, customColor, setPreset, setCustomColor } = useThemeStore();
  const [colorInput, setColorInput] = useState(customColor);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await client.post('/api/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      });
      toast.success('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to change password';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Color Theme */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Color Theme</h2>
          <p className="text-xs text-gray-500 mb-4">Choose a preset or enter any hex color to generate a custom palette.</p>

          {/* Preset swatches */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPreset(preset)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                  activePresetId === preset.id
                    ? 'border-gray-800 shadow-sm'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.palette[500] }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.palette[600] }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.palette[700] }} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{preset.name}</span>
                {activePresetId === preset.id && (
                  <span className="text-xs text-gray-800 font-semibold">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Custom color */}
          <div className="border-t border-gray-100 pt-4">
            <label className="label">Custom Color (hex)</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="#2563eb"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const hex = colorInput.trim();
                      if (/^#[0-9a-fA-F]{6}$/.test(hex)) setCustomColor(hex);
                      else toast.error('Enter a valid 6-digit hex color (e.g. #2563eb)');
                    }
                  }}
                />
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(colorInput) ? colorInput : '#2563eb' }}
                />
              </div>
              <input
                type="color"
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                value={/^#[0-9a-fA-F]{6}$/.test(colorInput) ? colorInput : '#2563eb'}
                onChange={(e) => {
                  setColorInput(e.target.value);
                  setCustomColor(e.target.value);
                }}
              />
              <button
                className="btn-primary btn-sm"
                onClick={() => {
                  const hex = colorInput.trim();
                  if (/^#[0-9a-fA-F]{6}$/.test(hex)) setCustomColor(hex);
                  else toast.error('Enter a valid 6-digit hex color (e.g. #2563eb)');
                }}
              >
                Apply
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Type a hex value and press Enter or click Apply. The color picker also works.</p>
          </div>

          {/* Live preview */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="btn-primary btn-sm">Primary Button</button>
              <button className="btn-secondary btn-sm">Secondary</button>
              <span className="badge-blue">Badge</span>
              <span className="text-sm text-primary-600 font-medium">Link text</span>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">App Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Club Name</span>
              <span className="font-medium text-gray-900">Young Lifters Club</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">School</span>
              <span className="font-medium text-gray-900">Deep Run High School</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Change Officer Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min. 6 characters)"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                className="btn-primary btn-sm"
                disabled={saving || !currentPw || !newPw || !confirmPw}
              >
                {saving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-400 mt-3">
            Note: After changing the password, you'll need to update the <code>APP_PASSWORD_HASH</code> environment variable on your server with the new bcrypt hash.
          </p>
        </div>

        {/* Instructions */}
        <div className="card p-5 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Password Hash Instructions</h2>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">To update the server password, generate a new bcrypt hash:</p>
          <code className="block bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-700 font-mono leading-relaxed">
            python -c "import bcrypt; print(bcrypt.hashpw(b'newpassword', bcrypt.gensalt()).decode())"
          </code>
          <p className="text-xs text-gray-500 mt-2">Then set the output as <code>APP_PASSWORD_HASH</code> in your <code>.env</code> file and restart the server.</p>
        </div>
      </div>
    </div>
  );
}
