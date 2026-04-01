import { useState } from 'react';
import toast from 'react-hot-toast';
import client from '@/api/client';
import { PRESETS, generatePalette, useThemeStore } from '@/store/themeStore';

export default function SettingsPage() {
  const { activeColor, applyColor } = useThemeStore();

  // Local pending state — not applied globally until Save is clicked
  const [pendingColor, setPendingColor] = useState(activeColor);
  const [colorInput, setColorInput] = useState(activeColor);
  const [saving, setSaving] = useState(false);

  const pendingPresetId = PRESETS.find((p) => p.palette[600] === pendingColor)?.id ?? 'custom';
  const previewPalette = generatePalette(pendingColor);
  const hasUnsaved = pendingColor !== activeColor;

  const handlePresetClick = (presetColor: string) => {
    setPendingColor(presetColor);
    setColorInput(presetColor);
  };

  const handleCustomApply = () => {
    const hex = colorInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setPendingColor(hex);
    } else {
      toast.error('Enter a valid 6-digit hex color (e.g. #2563eb)');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.put('/api/settings/theme', { color: pendingColor });
      applyColor(pendingColor);
      toast.success('Theme saved');
    } catch {
      toast.error('Failed to save theme');
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
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-800">Color Theme</h2>
            {hasUnsaved && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">Choose a preset or enter any hex color. Changes take effect after saving.</p>

          {/* Preset swatches */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.palette[600])}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                  pendingPresetId === preset.id
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
                {pendingPresetId === preset.id && (
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCustomApply(); }}
                />
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(colorInput) ? colorInput : pendingColor }}
                />
              </div>
              <input
                type="color"
                className="h-9 w-12 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                value={/^#[0-9a-fA-F]{6}$/.test(colorInput) ? colorInput : pendingColor}
                onChange={(e) => {
                  setColorInput(e.target.value);
                  setPendingColor(e.target.value);
                }}
              />
              <button className="btn-secondary btn-sm" onClick={handleCustomApply}>
                Apply
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Type a hex value and press Enter or click Apply. The color picker also works.</p>
          </div>

          {/* Preview — uses inline styles so it reflects pending color without affecting the rest of the app */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn btn-sm text-white"
                style={{ backgroundColor: previewPalette[600] }}
              >
                Primary Button
              </button>
              <button className="btn-secondary btn-sm">Secondary</button>
              <span
                className="badge text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: previewPalette[100], color: previewPalette[800] }}
              >
                Badge
              </span>
              <span className="text-sm font-medium" style={{ color: previewPalette[600] }}>
                Link text
              </span>
            </div>
          </div>

          {/* Save button */}
          <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end">
            <button
              className="btn text-white btn-sm"
              style={{ backgroundColor: hasUnsaved ? previewPalette[600] : undefined }}
              disabled={!hasUnsaved || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save Theme'}
            </button>
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

        {/* Password Hash Instructions */}
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
