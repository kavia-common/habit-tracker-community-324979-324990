import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { PageHeader, EmptyState } from "../components/ui";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function SocialPage() {
  /** Social features: friends, invites, quick activity. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);
  const [friendName, setFriendName] = useState("");

  const friends = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listFriends();
  }, [refresh]);

  const incoming = friends.filter((f) => f.status === "incoming");
  const accepted = friends.filter((f) => f.status === "accepted");
  const outgoing = friends.filter((f) => f.status === "outgoing");

  return (
    <div className="grid" style={{ gap: 12 }}>
      <PageHeader
        title="Social"
        subtitle="Build accountability with friends, celebrate badges, and keep each other going."
        actions={
          <button type="button" className="btn btn-small" onClick={() => ui.showToast("Social search coming soon (demo)")}>
            Find people
          </button>
        }
      />

      <div className="grid cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Friends</h2>
              <p className="card-subtitle">Requests, nudges, and connections</p>
            </div>
            <span className="pill">{accepted.length} connected</span>
          </div>

          <div className="card-body">
            <div className="grid" style={{ gap: 12 }}>
              <FormField label="Add a friend" help="Demo: creates an outgoing request.">
                <div className="row" style={{ alignItems: "stretch" }}>
                  <input
                    className="input"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    placeholder="Enter a name (e.g., Casey)"
                    aria-label="Friend name"
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!friendName.trim()}
                    onClick={() => {
                      demoApi.sendFriendRequest(friendName);
                      setFriendName("");
                      ui.showToast("Friend request sent (demo)");
                      setRefresh((x) => x + 1);
                    }}
                  >
                    Send
                  </button>
                </div>
              </FormField>

              <div className="notice">
                Social graph will be backed by real endpoints later; for now, demo requests and accept/decline incoming invites.
              </div>

              <div className="grid" style={{ gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>Incoming</div>
                {incoming.map((f) => (
                  <div key={f.id} className="list-item" style={{ alignItems: "center" }}>
                    <div>
                      <h3>{f.name}</h3>
                      <p>Wants to connect • Current streak: {f.streak}</p>
                    </div>
                    <div className="row wrap">
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => {
                          demoApi.respondToFriendRequest(f.id, "accept");
                          ui.showToast("Accepted");
                          setRefresh((x) => x + 1);
                        }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => {
                          demoApi.respondToFriendRequest(f.id, "decline");
                          ui.showToast("Declined");
                          setRefresh((x) => x + 1);
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {incoming.length === 0 ? (
                  <EmptyState title="No incoming requests" description="When someone sends you an invite, it’ll show up here." />
                ) : null}
              </div>

              <div className="grid" style={{ gap: 10, marginTop: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>Connected</div>
                {accepted.map((f) => (
                  <div key={f.id} className="list-item">
                    <div>
                      <h3>{f.name}</h3>
                      <p>Streak: {f.streak}</p>
                    </div>
                    <button type="button" className="btn btn-small" onClick={() => ui.showToast("Nudged (demo)")}>
                      Nudge
                    </button>
                  </div>
                ))}
                {accepted.length === 0 ? (
                  <EmptyState
                    title="No friends yet"
                    description="Add someone above to start building accountability."
                    action={
                      <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Invite link coming soon (demo)")}>
                        Invite link
                      </button>
                    }
                  />
                ) : null}
              </div>

              <div className="grid" style={{ gap: 10, marginTop: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>Outgoing</div>
                {outgoing.map((f) => (
                  <div key={f.id} className="list-item">
                    <div>
                      <h3>{f.name}</h3>
                      <p>Pending response</p>
                    </div>
                    <span className="pill">Pending</span>
                  </div>
                ))}
                {outgoing.length === 0 ? (
                  <EmptyState title="No outgoing requests" description="Send a request to get started." />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Badges</h2>
              <p className="card-subtitle">Earned through consistency & community</p>
            </div>
          </div>
          <div className="card-body">
            <div className="list">
              {demoApi.listMyBadges().map((b) => (
                <div key={b.id} className="list-item">
                  <div>
                    <h3>{b.badge?.name || b.badgeCode}</h3>
                    <p>{b.badge?.description || "—"}</p>
                    <p style={{ marginTop: 6 }}>Earned: {new Date(b.earnedAt).toLocaleString()}</p>
                  </div>
                  <span className="pill">Badge</span>
                </div>
              ))}
              {demoApi.listMyBadges().length === 0 ? (
                <EmptyState title="No badges yet" description="As you check in and connect with others, you’ll start unlocking badges." />
              ) : null}
            </div>

            <div style={{ marginTop: 12 }} className="row wrap">
              <button
                type="button"
                className="btn btn-small"
                onClick={() => {
                  // Demo trigger: adds a social badge if missing
                  demoApi.respondToFriendRequest(demoApi.listFriends().find((f) => f.status === "incoming")?.id, "accept");
                  ui.showToast("Badge progression updated (demo)");
                  setRefresh((x) => x + 1);
                }}
              >
                Demo: unlock social badge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
