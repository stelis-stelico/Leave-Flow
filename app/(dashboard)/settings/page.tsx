import { requireProfile } from "@/lib/auth";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ROLE_LABELS } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 max-w-[600px]">
        <h2 className="font-display text-[22px] md:text-[26px] text-gray-900 mb-1">Settings</h2>
        <p className="text-[13px] text-gray-400">Manage your account and preferences</p>
      </div>
      <div className="max-w-[600px] space-y-4">

        {/* Profile */}
        <Card>
          <CardHeader title="Your profile" />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-lg font-bold text-green-700 font-mono flex-shrink-0">
                {profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-gray-900">{profile.full_name}</p>
                <p className="text-[12px] text-gray-400">{profile.email}</p>
                <p className="text-[11px] text-green-600 font-medium mt-0.5">{ROLE_LABELS[profile.role]}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-green-100">
              {[
                ["Full name",    profile.full_name],
                ["Email",        profile.email],
                ["Department",   profile.department ?? "Not set"],
                ["Shift",        profile.shift       ?? "Not set"],
                ["Role",         ROLE_LABELS[profile.role]],
                ["Member since", new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-[13px] text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader title="Change password" />
          <CardBody className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5">Current password</label>
              <input type="password" className="input-base" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5">New password</label>
              <input type="password" className="input-base" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5">Confirm new password</label>
              <input type="password" className="input-base" placeholder="••••••••" />
            </div>
            <button className="btn-green mt-1">Update password</button>
          </CardBody>
        </Card>

        {/* Notification prefs */}
        <Card>
          <CardHeader title="Notification preferences" />
          <CardBody className="space-y-3">
            {[
              { label: "Email on request submitted",    desc: "Receive confirmation when you submit a request",       checked: true },
              { label: "Email on approval step",        desc: "Notified at each approval stage",                      checked: true },
              { label: "Email on full approval",        desc: "Notified when your request is fully approved",         checked: true },
              { label: "Email on rejection",            desc: "Notified if your request is rejected with a reason",   checked: true },
              { label: "Approver — new request alerts", desc: "Get notified when requests need your approval",        checked: true },
            ].map((pref) => (
              <label key={pref.label} className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input type="checkbox" defaultChecked={pref.checked} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-green-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-gray-900">{pref.label}</p>
                  <p className="text-[11px] text-gray-400">{pref.desc}</p>
                </div>
              </label>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
