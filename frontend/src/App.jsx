import { useCallback, useEffect, useMemo, useState } from "react";
import { api, opportunityPayload } from "./api.js";
import Dialog from "./components/Dialog.jsx";
import Icon from "./components/Icon.jsx";
import OpportunityForm from "./components/OpportunityForm.jsx";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function deadlineDays(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${value}T00:00:00`) - today) / 86400000);
}

function Badge({ status }) {
  return (
    <span
      className={`status-badge ${status === "Open" ? "status-open" : "status-closed"}`}
    >
      <span />
      {status}
    </span>
  );
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState(null);
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pending, setPending] = useState("");
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setRecords(await api.list());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(
    () => ({
      open: records.filter((record) => record.status === "Open").length,
      positions: records
        .filter((record) => record.status === "Open")
        .reduce((sum, record) => sum + record.available_positions, 0),
      soon: records.filter(
        (record) =>
          record.status === "Open" &&
          deadlineDays(record.application_deadline) >= 0 &&
          deadlineDays(record.application_deadline) <= 14,
      ).length,
    }),
    [records],
  );

  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();
    return records
      .filter(
        (record) =>
          (status === "All" || record.status === status) &&
          [
            record.title,
            record.research_area,
            record.faculty_name,
            record.department,
            record.required_skills,
          ].some((value) => value.toLowerCase().includes(search)),
      )
      .sort((a, b) =>
        sort === "deadline"
          ? a.application_deadline.localeCompare(b.application_deadline) ||
            b.id - a.id
          : sort === "title"
            ? a.title.localeCompare(b.title)
            : b.id - a.id,
      );
  }, [records, query, status, sort]);

  function replaceRecord(saved) {
    setRecords((current) =>
      current.map((record) => (record.id === saved.id ? saved : record)),
    );
  }
  function notify(message, type = "success") {
    setToast({ message, type });
  }

  async function save(data) {
    if (form.record) {
      replaceRecord(await api.update(form.record.id, data));
      notify("Opportunity updated successfully.");
    } else {
      const saved = await api.create(data);
      setRecords((current) => [saved, ...current]);
      notify("Opportunity created successfully.");
    }
    setForm(null);
  }

  async function view(record) {
    setPending(`view-${record.id}`);
    try {
      setDetails(await api.get(record.id));
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setPending("");
    }
  }

  async function changeStatus(record) {
    const next = record.status === "Open" ? "Closed" : "Open";
    setPending(`status-${record.id}`);
    try {
      replaceRecord(
        await api.update(record.id, {
          ...opportunityPayload(record),
          status: next,
        }),
      );
      notify(`Opportunity marked ${next.toLowerCase()}.`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setPending("");
    }
  }

  async function remove() {
    setPending("delete");
    try {
      await api.remove(deleting.id);
      setRecords((current) =>
        current.filter((record) => record.id !== deleting.id),
      );
      setDeleting(null);
      notify("Opportunity deleted successfully.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setPending("");
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="brand" aria-label="Research Commons home">
            <span className="brand-symbol">
              <Icon name="book" size={23} />
            </span>
            <span>
              research<span className="brand-light">commons</span>
              <small>UNIVERSITY OPPORTUNITY PORTAL</small>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <span className="nav-current">Opportunities</span>
            <a
              href="https://github.com/p240756-prog/research-opportunity-portal"
              target="_blank"
              rel="noreferrer"
            >
              Repository <Icon name="external" size={14} />
            </a>
          </nav>
          <span className="header-label">
            <span className="avatar">RC</span> Faculty workspace
          </span>
        </div>
      </header>
      <main className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-line" />
              CONNECT. DISCOVER. CONTRIBUTE.
            </p>
            <h1>
              Great research starts
              <br />
              with <em>an opportunity.</em>
            </h1>
            <p className="hero-description">
              A shared space for curious minds. Discover research openings and
              build your next collaboration.
            </p>
            <button
              className="button button-primary"
              onClick={() => setForm({ record: null })}
            >
              <Icon name="plus" />
              Post an opportunity
            </button>
          </div>
          <div className="hero-aside">
            <span className="edition">THE RESEARCH BOARD / 01</span>
            <div className="orbital" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <span className="orbit orbit-three" />
              <span className="orbit-core">
                <Icon name="book" size={38} />
              </span>
              <span className="orbit-point point-one" />
              <span className="orbit-point point-two" />
            </div>
            <p>
              Ideas meet people.
              <br />
              <strong>Possibilities become projects.</strong>
            </p>
          </div>
        </section>
        <section className="stats" aria-label="Research opportunity statistics">
          <div>
            <span className="stat-icon">
              <Icon name="book" size={22} />
            </span>
            <p>
              <strong>{loadError ? "—" : records.length}</strong>
              <span>Total opportunities</span>
            </p>
          </div>
          <div>
            <span className="stat-icon">
              <Icon name="check" size={22} />
            </span>
            <p>
              <strong>{loadError ? "—" : stats.open}</strong>
              <span>Open for applications</span>
            </p>
          </div>
          <div>
            <span className="stat-icon">
              <Icon name="people" size={22} />
            </span>
            <p>
              <strong>{loadError ? "—" : stats.positions}</strong>
              <span>Available positions</span>
            </p>
          </div>
          <div>
            <span className="stat-icon">
              <Icon name="calendar" size={22} />
            </span>
            <p>
              <strong>{loadError ? "—" : stats.soon}</strong>
              <span>Closing in 14 days</span>
            </p>
          </div>
        </section>
        <section className="research-board" aria-labelledby="board-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE THE BOARD</p>
              <h2 id="board-heading">
                Research opportunities <span>{records.length}</span>
              </h2>
            </div>
            <button
              className="button button-secondary button-small"
              onClick={load}
              disabled={loading || Boolean(pending)}
            >
              <Icon name="refresh" />
              Refresh
            </button>
          </div>
          <div className="toolbar">
            <div className="search-box">
              <Icon name="search" />
              <input
                type="search"
                aria-label="Search opportunities"
                placeholder="Search title, skills, faculty, or department…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div
              className="filter-tabs"
              role="group"
              aria-label="Filter by status"
            >
              {["All", "Open", "Closed"].map((value) => (
                <button
                  key={value}
                  className={status === value ? "active" : ""}
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <label className="sort-label">
              Sort by
              <select
                aria-label="Sort opportunities"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="deadline">Deadline</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
          </div>
          {loading ? (
            <div className="empty-state" role="status">
              <span className="spinner" />
              <h3>Loading the research board</h3>
              <p>Fetching opportunities from the database.</p>
            </div>
          ) : loadError ? (
            <div className="empty-state error-state" role="alert">
              <Icon name="refresh" size={30} />
              <h3>The board is unavailable</h3>
              <p>{loadError}</p>
              <button className="button button-primary" onClick={load}>
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="book" size={30} />
              </span>
              <h3>
                {records.length
                  ? "No matching opportunities"
                  : "Your next discovery starts here"}
              </h3>
              <p>
                {records.length
                  ? "Try another search or status filter."
                  : "Post the first research opportunity and invite students to get involved."}
              </p>
              {records.length ? (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setQuery("");
                    setStatus("All");
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  className="button button-primary"
                  onClick={() => setForm({ record: null })}
                >
                  <Icon name="plus" />
                  Create first opportunity
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="results-count">
                Showing {filtered.length} of {records.length} opportunities
              </p>
              <div className="card-grid">
                {filtered.map((record) => (
                  <article
                    className={`opportunity-card ${record.status === "Closed" ? "card-closed" : ""}`}
                    key={record.id}
                  >
                    <div className="card-top">
                      <span className="area-label">{record.research_area}</span>
                      <Badge status={record.status} />
                    </div>
                    <h3>{record.title}</h3>
                    <p className="card-description">{record.description}</p>
                    <div className="faculty-line">
                      <span className="faculty-avatar">
                        {record.faculty_name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>{record.faculty_name}</strong>
                        <span>{record.department}</span>
                      </div>
                    </div>
                    <div className="skill-tags">
                      {record.required_skills
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((skill, index) => (
                          <span key={`${skill}-${index}`}>{skill}</span>
                        ))}
                    </div>
                    <div className="card-meta">
                      <span>
                        <Icon name="people" size={16} />
                        {record.available_positions}{" "}
                        {record.available_positions === 1
                          ? "position"
                          : "positions"}
                      </span>
                      <span
                        className={
                          deadlineDays(record.application_deadline) < 0
                            ? "past-deadline"
                            : ""
                        }
                      >
                        <Icon name="calendar" size={16} />
                        {formatDate(record.application_deadline)}
                      </span>
                    </div>
                    <footer className="card-footer">
                      <button
                        className="text-button"
                        onClick={() => view(record)}
                        disabled={Boolean(pending)}
                      >
                        View details <Icon name="arrow" size={16} />
                      </button>
                      <div className="card-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${record.title}`}
                          title="Edit opportunity"
                          onClick={() => setForm({ record })}
                          disabled={Boolean(pending)}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`${record.status === "Open" ? "Close" : "Reopen"} ${record.title}`}
                          title={
                            record.status === "Open"
                              ? "Mark as closed"
                              : "Reopen opportunity"
                          }
                          onClick={() => changeStatus(record)}
                          disabled={Boolean(pending)}
                        >
                          <Icon
                            name={record.status === "Open" ? "lock" : "check"}
                            size={17}
                          />
                        </button>
                        <button
                          className="icon-button delete-button"
                          aria-label={`Delete ${record.title}`}
                          title="Delete opportunity"
                          onClick={() => setDeleting(record)}
                          disabled={Boolean(pending)}
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
        <footer className="site-footer">
          <span>Research Commons</span>
          <p>A place for ideas to find their people.</p>
          <span>University Research Opportunity Portal</span>
        </footer>
      </main>
      <div
        className="notification-region"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            <Icon name={toast.type === "error" ? "close" : "check"} />
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </div>
      {form && (
        <OpportunityForm
          record={form.record}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
      {details && (
        <Dialog
          title={details.title}
          subtitle={details.research_area}
          onClose={() => setDetails(null)}
        >
          <div className="detail-body">
            <div className="detail-heading">
              <Badge status={details.status} />
              <span className="record-id">Opportunity #{details.id}</span>
            </div>
            <h3>About the research</h3>
            <p className="detail-description">{details.description}</p>
            <dl className="detail-grid">
              <div>
                <dt>Faculty member</dt>
                <dd>{details.faculty_name}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{details.department}</dd>
              </div>
              <div>
                <dt>Available positions</dt>
                <dd>{details.available_positions}</dd>
              </div>
              <div>
                <dt>Application deadline</dt>
                <dd>
                  {formatDate(details.application_deadline)}
                  {deadlineDays(details.application_deadline) < 0 && (
                    <small>Deadline has passed</small>
                  )}
                </dd>
              </div>
              <div className="field-wide">
                <dt>Required skills</dt>
                <dd>{details.required_skills}</dd>
              </div>
            </dl>
          </div>
          <footer className="dialog-footer">
            <button
              className="button button-secondary"
              onClick={() => setDetails(null)}
            >
              Close
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                setForm({ record: details });
                setDetails(null);
              }}
            >
              <Icon name="edit" />
              Edit opportunity
            </button>
          </footer>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title="Delete this opportunity?"
          subtitle="This action permanently removes the record."
          onClose={() => setDeleting(null)}
          busy={pending === "delete"}
          compact
        >
          <div className="delete-content">
            <span className="delete-symbol">
              <Icon name="trash" size={25} />
            </span>
            <p>
              <strong>{deleting.title}</strong>
            </p>
            <p>
              Students will no longer see this research opportunity. You can
              close it instead if you want to keep the record.
            </p>
          </div>
          <footer className="dialog-footer">
            <button
              className="button button-secondary"
              onClick={() => setDeleting(null)}
              disabled={pending === "delete"}
            >
              Cancel
            </button>
            <button
              className="button button-danger"
              onClick={remove}
              disabled={pending === "delete"}
            >
              <Icon name="trash" />
              {pending === "delete" ? "Deleting…" : "Delete opportunity"}
            </button>
          </footer>
        </Dialog>
      )}
    </>
  );
}
