import { useState } from "react";
import Dialog from "./Dialog.jsx";
import Icon from "./Icon.jsx";

const emptyForm = {
  title: "",
  description: "",
  research_area: "",
  faculty_name: "",
  department: "",
  required_skills: "",
  available_positions: "1",
  application_deadline: "",
  status: "Open",
};
const limits = {
  title: 180,
  description: 10000,
  research_area: 100,
  faculty_name: 120,
  department: 120,
  required_skills: 1000,
};

export default function OpportunityForm({ record, onClose, onSave }) {
  const [form, setForm] = useState(
    record
      ? Object.fromEntries(
          Object.keys(emptyForm).map((key) => [key, String(record[key])]),
        )
      : emptyForm,
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    const invalid = {};
    for (const [key, limit] of Object.entries(limits)) {
      if (!form[key].trim()) invalid[key] = "This field is required.";
      else if (form[key].trim().length > limit)
        invalid[key] = `Use at most ${limit} characters.`;
    }
    if (
      !/^\d+$/.test(form.available_positions) ||
      Number(form.available_positions) < 1 ||
      Number(form.available_positions) > 1000
    )
      invalid.available_positions = "Enter a whole number from 1 to 1000.";
    if (!form.application_deadline)
      invalid.application_deadline = "Choose an application deadline.";
    setErrors(invalid);
    setMessage("");
    if (Object.keys(invalid).length) {
      setMessage("Please complete the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      await onSave({
        ...form,
        available_positions: Number(form.available_positions),
      });
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function field(name, label, options = {}) {
    const { wide = false, textarea = false, hint, ...attributes } = options;
    const props = {
      id: `field-${name}`,
      name,
      value: form[name],
      onChange: change,
      onInput: name === "application_deadline" ? change : undefined,
      required: true,
      disabled: busy,
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `error-${name}` : undefined,
      ...attributes,
    };
    return (
      <div className={`form-field ${wide ? "field-wide" : ""}`}>
        <label htmlFor={props.id}>
          {label} <span aria-hidden="true">*</span>
        </label>
        {textarea ? (
          <textarea {...props} rows={name === "description" ? 4 : 2} />
        ) : (
          <input {...props} />
        )}
        {errors[name] ? (
          <small className="field-error" id={`error-${name}`}>
            {errors[name]}
          </small>
        ) : (
          hint && <small>{hint}</small>
        )}
      </div>
    );
  }

  return (
    <Dialog
      title={record ? "Edit opportunity" : "Create an opportunity"}
      subtitle="Bring your next research collaboration to life."
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} noValidate>
        <div className="form-body">
          {message && (
            <div className="inline-error" role="alert">
              {message}
            </div>
          )}
          <div className="form-grid">
            {field("title", "Research title", {
              wide: true,
              maxLength: limits.title,
              placeholder: "Give your opportunity a clear, descriptive title",
            })}
            {field("description", "Research description", {
              wide: true,
              textarea: true,
              maxLength: limits.description,
              placeholder:
                "Describe the project, responsibilities, and what students will learn.",
            })}
            {field("research_area", "Research area", {
              maxLength: limits.research_area,
              placeholder: "e.g. Computer Networks",
            })}
            {field("department", "Department", {
              maxLength: limits.department,
              placeholder: "e.g. Computer Science",
            })}
            {field("faculty_name", "Faculty member", {
              maxLength: limits.faculty_name,
              placeholder: "Faculty member’s full name",
            })}
            {field("available_positions", "Available positions", {
              type: "number",
              min: 1,
              max: 1000,
              step: 1,
            })}
            {field("required_skills", "Required skills", {
              wide: true,
              textarea: true,
              maxLength: limits.required_skills,
              placeholder: "e.g. Python, data analysis, technical writing",
              hint: "Separate skills with commas for easy reading.",
            })}
            {field("application_deadline", "Application deadline", {
              type: "date",
            })}
            <div className="form-field">
              <label htmlFor="field-status">
                Status <span aria-hidden="true">*</span>
              </label>
              <select
                id="field-status"
                name="status"
                value={form.status}
                onChange={change}
                disabled={busy}
              >
                <option>Open</option>
                <option>Closed</option>
              </select>
              {errors.status && (
                <small className="field-error">{errors.status}</small>
              )}
            </div>
          </div>
          <p className="form-note">
            All fields are required. Changes are saved to the research database.
          </p>
        </div>
        <footer className="dialog-footer">
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={busy}
          >
            <Icon name={record ? "check" : "plus"} />
            {busy ? "Saving…" : record ? "Save changes" : "Create opportunity"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
