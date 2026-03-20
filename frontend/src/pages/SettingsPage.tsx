import { useState } from 'react';
import toast from 'react-hot-toast';
import client from '@/api/client';

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

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

      <div className="max-w-lg space-y-6">
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
